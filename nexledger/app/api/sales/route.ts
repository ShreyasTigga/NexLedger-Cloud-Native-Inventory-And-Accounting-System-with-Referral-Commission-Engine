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

    if (!user || (user.role !== "retailer" && user.role !== "customer")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      retailerId = new mongoose.Types.ObjectId(user.userId)
      customerId = new mongoose.Types.ObjectId(body.customerId)
    } else {
      const customer = await Customer.findOne({
        userId: user.userId
      })

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }

      retailerId = customer.retailerId
      customerId = customer._id
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

      for (const item of items) {

        const product = await Item.findOne({
          _id: item.productId,
          retailerId
        }).session(session)

        if (!product) throw new Error("Product not found")

        if (product.stockQuantity < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`)
        }

        // ✅ STOCK UPDATE
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
      const [invoice] = await SalesInvoice.create(
        [
          {
            retailerId,
            customerId,
            referredBy: customer.referredBy,
            items: processedItems,
            totalAmount
          }
        ],
        { session }
      )

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

      // ================= REFERRAL =================
      await processReferralCommission({
        saleId: invoiceId!,
        customerId,
        totalAmount,
        session: session ?? undefined
      })

      // ================= LEDGER =================
await LedgerEntry.insertMany(
  [
    {
      retailerId,
      type: "debit",
      account: "Customer",
      amount: totalAmount,
      referenceId: invoiceId!,
      referenceModel: "Sale", // ✅ ADD THIS
      description: "Sale"
    },
    {
      retailerId,
      type: "credit",
      account: "Sales",
      amount: totalAmount - (totalCGST + totalSGST),
      referenceId: invoiceId!,
      referenceModel: "Sale", // ✅ ADD THIS
      description: "Revenue"
    },
    {
      retailerId,
      type: "credit",
      account: "CGST Payable",
      amount: totalCGST,
      referenceId: invoiceId!,
      referenceModel: "Sale", // ✅ ADD THIS
      description: "CGST"
    },
    {
      retailerId,
      type: "credit",
      account: "SGST Payable",
      amount: totalSGST,
      referenceId: invoiceId!,
      referenceModel: "Sale", // ✅ ADD THIS
      description: "SGST"
    }
  ],
  { session }
)

    })

    // ✅ SAFE CHECK (CORRECT PLACE)
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

    let user

    try {
      user = await getUserFromRequest(req)
    } catch {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!user || user.role !== "retailer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const retailerId = new mongoose.Types.ObjectId(user.userId)

    // 🔥 Fetch invoices
    const invoices = await SalesInvoice.find({ retailerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("totalAmount createdAt")
      .lean()

    // 🔥 Total revenue
    const revenueData = await SalesInvoice.aggregate([
      { $match: { retailerId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ])

    const totalRevenue = revenueData[0]?.totalRevenue || 0
    const totalSales = invoices.length

    return NextResponse.json({
      totalSales,
      totalRevenue,
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