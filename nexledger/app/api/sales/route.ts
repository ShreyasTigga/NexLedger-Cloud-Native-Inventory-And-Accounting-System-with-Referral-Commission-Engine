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
      if (!user.userId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      retailerId = new mongoose.Types.ObjectId(user.userId)
      customerId = new mongoose.Types.ObjectId(body.customerId)
    } else {
      if (!user.customerId || !user.retailerId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

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
      let totalAmount = 0
      let totalCGST = 0
      let totalSGST = 0
      let totalProfit = 0

      const config = await ReferralConfig.findOne({
        retailerId,
        isActive: true
      }).sort({ createdAt: -1 }).session(session)

      if (!config) {
        throw new Error("Referral config not found")
      }

      for (const item of items) {

        const product = await Item.findOne({
          _id: item.productId,
          retailerId
        }).session(session)

        console.log("PRODUCT:", product)

        if (!product) throw new Error("Product not found")

        if (product.stockQuantity < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`)
        }

        // STOCK UPDATE
        product.stockQuantity -= item.quantity
        await product.save({ session })

        const price = product.sellingPrice
        const taxRate = product.taxRate

        const base = price * item.quantity

        const cgst = taxRate / 2
        const sgst = taxRate / 2

        const cgstAmount = (base * cgst) / 100
        const sgstAmount = (base * sgst) / 100
        const gstAmount = cgstAmount + sgstAmount
        const total = base + gstAmount

        totalAmount += total
        totalCGST += cgstAmount
        totalSGST += sgstAmount

        const cost = product.costPrice * item.quantity
        const revenue = product.sellingPrice * item.quantity

        const profit = revenue - cost
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
      }

      const transactionId = `txn_${Date.now()}`
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      const amountPaid = body.amountPaid ?? totalAmount

      const paymentStatus =
        amountPaid === 0
          ? "pending"
          : amountPaid < totalAmount
          ? "partial"
          : "paid"

      const created = await SalesInvoice.create(
        [
          {
            retailerId,
            customerId,

            invoiceNumber,
            transactionId,

            referralConfigIdUsed: config._id,

            referralConfigSnapshot: {
              levels: config.levels,
              percentages: config.percentages,
              commissionType: config.commissionType,
              maxCommissionPerSale: config.maxCommissionPerSale
            },

            items: processedItems,

            subtotal: totalAmount - (totalCGST + totalSGST),
            taxAmount: totalCGST + totalSGST,
            discount: 0,

            totalAmount,

            amountPaid,
            paymentStatus,

            profit: totalProfit 
          }
        ],
        { session }
      )

      const invoice = created[0] as any
      invoiceId = invoice._id

// ================= STOCK MOVEMENT =================
for (const item of processedItems) {

  const product = await Item.findOne({
    _id: item.itemId,
    retailerId
  }).session(session)

  if (!product) throw new Error("Product not found")

  const stockAfter = product.stockQuantity // already reduced above

  await StockMovement.create(
    [
      {
        retailerId,
        itemId: item.itemId,

        type: "sale",
        direction: "out",

        quantity: item.quantity,
        transactionId,

        referenceId: invoiceId!,
        referenceModel: "Sale",

        stockAfter 
      }
    ],
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
            description: "Sale to customer"
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
            description: "Revenue from sale"
          },
          {
            retailerId,
            transactionId,
            account: "CGST Payable",
            accountType: "liability",
            type: "credit",
            amount: totalCGST,
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "CGST collected"
          },
          {
            retailerId,
            transactionId,
            account: "SGST Payable",
            accountType: "liability",
            type: "credit",
            amount: totalSGST,
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "SGST collected"
          }
        ],
        { session }
      )

      // ================= REFERRAL =================

      console.log("TOTAL PROFIT:", totalProfit)

      if (totalProfit > 0) {
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

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice creation failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Sale completed",
      invoiceId
    })

  } catch (err: any) {
    console.error("SALE ERROR:", err)

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