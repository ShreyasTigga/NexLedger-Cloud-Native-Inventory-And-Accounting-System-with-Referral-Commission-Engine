import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose, { ClientSession } from "mongoose"

import Item from "@/models/item"
import Customer from "@/models/customer"
import SalesInvoice from "@/models/salesInvoice"
import StockMovement from "@/models/stockMovement"
import LedgerEntry from "@/models/ledgerEntry"
import { processReferralCommission } from "@/lib/referralService"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import ReferralConfig from "@/models/referralConfig"

export async function POST(req: NextRequest) {
  let session: ClientSession | null = null

  try {
    await dbConnect()
    session = await mongoose.startSession()

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "retailer" && user.role !== "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const items = body.items

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    let retailerId: mongoose.Types.ObjectId
    let customerId: mongoose.Types.ObjectId

    if (user.role === "retailer") {
      retailerId = new mongoose.Types.ObjectId(user.userId)
      customerId = new mongoose.Types.ObjectId(body.customerId)
    } else {
      retailerId = new mongoose.Types.ObjectId(user.retailerId)
      customerId = new mongoose.Types.ObjectId(user.customerId)
    }

    let invoiceId: mongoose.Types.ObjectId | null = null

    await session.withTransaction(async () => {

      const customer = await Customer.findOne({
        _id: customerId,
        retailerId
      }).session(session)

      if (!customer) throw new Error("Customer not found")

      const processedItems: any[] = []
      const stockMovements: any[] = []
      const itemUpdates: any[] = []

      let totalAmount = 0
      let totalCGST = 0
      let totalSGST = 0
      let totalProfit = 0

      const config = await ReferralConfig.findOne({
        retailerId,
        isActive: true
      })
        .sort({ createdAt: -1 })
        .session(session)
        .lean() as {
  _id: mongoose.Types.ObjectId
  levels: number
  percentages: number[]
  distributionPercentage: number
  commissionType: "fixed" | "percentage"
  maxCommissionPerSale: number
} | null



      // ================= PROCESS ITEMS =================
      for (const item of items) {

        const product = await Item.findOne({
          _id: item.productId,
          retailerId
        }).session(session)

        if (!product) throw new Error("Product not found")

        if (product.stockQuantity < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`)
        }

        const newQty = product.stockQuantity - item.quantity

        const price = product.sellingPrice
        const taxRate = product.taxRate

        const base = price * item.quantity

        const cgst = taxRate / 2
        const sgst = taxRate / 2

        const cgstAmount = (base * cgst) / 100
        const sgstAmount = (base * sgst) / 100
        const gstAmount = cgstAmount + sgstAmount
        const total = base + gstAmount

        const cost = product.costPrice * item.quantity
        const revenue = price * item.quantity
        const profit = revenue - cost

        totalAmount += total
        totalCGST += cgstAmount
        totalSGST += sgstAmount
        totalProfit += profit

        processedItems.push({
          itemId: product._id,
          name: product.name,
          quantity: item.quantity,
          costPrice: product.costPrice,
          price,
          taxRate,
          cgst,
          sgst,
          cgstAmount,
          sgstAmount,
          gstAmount,
          profit,
          total
        })

        // 📜 Stock movement prep
        stockMovements.push({
          itemId: product._id,
          quantity: item.quantity,
          price,               // 🔥 important
          totalAmount: total,  // 🔥 important
          stockAfter: newQty
        })

        // 📦 Item update prep
        itemUpdates.push({
          itemId: product._id,
          newQty
        })
      }

      const transactionId = `txn_${Date.now()}`
      const invoiceNumber = `INV-${Date.now()}`

      const amountPaid = body.amountPaid ?? totalAmount

      const paymentStatus =
        amountPaid === 0
          ? "pending"
          : amountPaid < totalAmount
          ? "partial"
          : "paid"

      // ================= CREATE INVOICE =================
      const created = await SalesInvoice.create(
        [
          {
            retailerId,
            customerId,
            invoiceNumber,
            transactionId,

            referralConfigIdUsed: config?._id,

           referralConfigSnapshot: {
  levels: config?.levels ?? 0,
  percentages: config?.percentages ?? [],
  distributionPercentage: config?.distributionPercentage ?? 100,
  commissionType: config?.commissionType ?? "percentage",
  maxCommissionPerSale: config?.maxCommissionPerSale ?? 0
},

            items: processedItems,

            subtotal: totalAmount - (totalCGST + totalSGST),
            taxAmount: totalCGST + totalSGST,
            totalAmount,

            amountPaid,
            paymentStatus,
            profit: totalProfit
          }
        ],
        { session }
      )

      const invoice = created[0]
      invoiceId = invoice._id

      // ================= STOCK MOVEMENT =================
      for (const move of stockMovements) {
        await StockMovement.create(
          [
            {
              retailerId,
              itemId: move.itemId,

              type: "sale",
              direction: "out",

              transactionId,

              quantity: move.quantity,
              price: move.price,              // 🔥 FIX
              totalAmount: move.totalAmount,  // 🔥 FIX

              referenceId: invoiceId!,
              referenceModel: "Sale",

              stockAfter: move.stockAfter
            }
          ],
          { session }
        )
      }

      // ================= UPDATE ITEMS =================
      for (const update of itemUpdates) {
        await Item.findOneAndUpdate(
          { _id: update.itemId, retailerId },
          { stockQuantity: update.newQty },
          { session }
        )
      }

      // ================= LEDGER =================
      await LedgerEntry.insertMany(
        [
          {
            retailerId,
            transactionId,
            account: "Accounts Receivable",
            accountType: "asset",
            type: "debit",
            amount: totalAmount,
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "Sale"
          },
          {
            retailerId,
            transactionId,
            account: "Sales Revenue",
            accountType: "income",
            type: "credit",
            amount: totalAmount - (totalCGST + totalSGST),
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "Revenue"
          }
        ],
        { session }
      )

      // ================= REFERRAL =================
      if (totalProfit > 0 && config) {
        await processReferralCommission({
          saleId: invoiceId!,
          customerId,
          profitAmount: totalProfit,
          retailerId,
          transactionId,
          session: session ?? undefined
        })
      }
    })

    return NextResponse.json({
      message: "Sale completed",
      invoiceId
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  } finally {
    if (session) session.endSession()
  }
}

// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🔐 ROLE
    if (user.role !== "retailer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 🔐 TOKEN SAFETY
    if (!user.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const retailerId = user.userId

    const invoices = await SalesInvoice.find({ retailerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("totalAmount profit createdAt")
      .lean()

    const revenueData = await SalesInvoice.aggregate([
      { $match: { retailerId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$profit" }
        }
      }
    ])

    const totalRevenue = revenueData[0]?.totalRevenue || 0
    const totalProfit = revenueData[0]?.totalProfit || 0
    const totalSales = invoices.length

    return NextResponse.json({
      totalSales,
      totalRevenue,
      totalProfit,
      invoices
    })

  } catch (err: any) {
    console.error("SALES GET ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}