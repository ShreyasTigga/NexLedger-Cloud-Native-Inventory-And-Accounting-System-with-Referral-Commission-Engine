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

export async function POST(req: NextRequest) {
  let session: ClientSession | null = null

  try {
    await dbConnect()
    session = await mongoose.startSession()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🔐 ROLE
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

    // ================= ROLE FLOW =================
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

      for (const item of items) {

        const product = await Item.findOne({
          _id: item.productId,
          retailerId
        }).session(session)

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
          total
        })
      }

      // ================= CREATE INVOICE =================
      const created = await SalesInvoice.create(
  [
    {
      retailerId,
      customerId,
      referredBy: customer.referredBy,
      items: processedItems,
      totalAmount,
      profit: totalProfit
    }
  ],
  { session }
)

const invoice = created[0] as any

      invoiceId = invoice._id

      // ================= STOCK MOVEMENT =================
      await StockMovement.insertMany(
        processedItems.map(item => ({
          retailerId,
          itemId: item.itemId,
          type: "sale",
          quantity: -item.quantity,
          reference: invoiceId!.toString()
        })),
        { session }
      )

      // ================= LEDGER =================
      await LedgerEntry.insertMany(
        [
          {
            retailerId,
            type: "debit",
            account: "Customer",
            amount: totalAmount,
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "Sale"
          },
          {
            retailerId,
            type: "credit",
            account: "Sales",
            amount: totalAmount - (totalCGST + totalSGST),
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "Revenue"
          },
          {
            retailerId,
            type: "credit",
            account: "CGST Payable",
            amount: totalCGST,
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "CGST"
          },
          {
            retailerId,
            type: "credit",
            account: "SGST Payable",
            amount: totalSGST,
            referenceId: invoiceId!,
            referenceModel: "Sale",
            description: "SGST"
          }
        ],
        { session }
      )

      // ================= REFERRAL =================
      if (totalProfit > 0) {
        await processReferralCommission({
          saleId: invoiceId!,
          customerId,
          profitAmount: totalProfit,
          retailerId,
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