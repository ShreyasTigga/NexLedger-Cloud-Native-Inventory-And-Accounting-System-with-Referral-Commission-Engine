import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose, { ClientSession } from "mongoose"

import Item from "@/models/item"
import Customer from "@/models/customer"
import SalesInvoice, { SalesInvoiceDocument } from "@/models/salesInvoice"
import StockMovement from "@/models/stockMovement"
import LedgerEntry from "@/models/ledgerEntry"
import { processReferralCommission } from "@/lib/referralService"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get("page")) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const retailerId = new mongoose.Types.ObjectId(user.userId)

    const invoices = await SalesInvoice.find({ retailerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("customerId totalAmount createdAt")
      .lean()

    const total = await SalesInvoice.countDocuments({ retailerId })

    return NextResponse.json({
      invoices,
      totalPages: Math.ceil(total / limit)
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ================= POST =================
export async function POST(req: NextRequest) {
  let session: ClientSession | undefined

  try {
    await dbConnect()
    session = await mongoose.startSession()

    const user = getUserFromRequest(req)

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

    // ================= FLOW =================
    if (user.role === "retailer") {
      if (!body.customerId || !mongoose.Types.ObjectId.isValid(body.customerId)) {
        return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
      }

      retailerId = new mongoose.Types.ObjectId(user.userId)
      customerId = new mongoose.Types.ObjectId(body.customerId)

    } else {
      const customer = await Customer.findOne({
        userId: user.userId
      }).session(session)

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }

      retailerId = customer.retailerId
      customerId = customer._id
    }

    await session.withTransaction(async () => {

      const customer = await Customer.findOne({
        _id: customerId,
        retailerId
      }).session(session || null)

      if (!customer) throw new Error("Customer not found")

      const seenProducts = new Set<string>()

      const processedItems: SalesInvoiceDocument["items"] = []

      let totalAmount = 0
      let totalCGST = 0
      let totalSGST = 0

      for (const item of items) {

        if (
          !item.productId ||
          !mongoose.Types.ObjectId.isValid(item.productId) ||
          !item.quantity ||
          item.quantity <= 0
        ) {
          throw new Error("Invalid item data")
        }

        if (seenProducts.has(item.productId)) {
          throw new Error("Duplicate product in cart")
        }

        seenProducts.add(item.productId)

        const product = await Item.findOne({
          _id: item.productId,
          retailerId
        }).session(session || null)

        if (!product) throw new Error("Product not found")
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`)
        }

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
          price,
          taxRate,
          cgst,
          sgst,
          cgstAmount,
          sgstAmount,
          gstAmount,
          total
        })

        await Item.updateOne(
          { _id: product._id, retailerId },
          { $inc: { stockQuantity: -item.quantity } },
          { session }
        )
      }

      // ================= INVOICE =================
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

      const invoiceId = invoice._id

      // ================= STOCK =================
      await StockMovement.insertMany(
        processedItems.map(item => ({
          retailerId,
          itemId: item.itemId,
          type: "sale",
          quantity: -item.quantity,
          reference: invoiceId.toString()
        })),
        { session }
      )

      // ================= REFERRAL =================
      await processReferralCommission({
        saleId: invoiceId,
        customerId,
        totalAmount,
        session
      })

      // ================= LEDGER =================
      await LedgerEntry.insertMany(
        [
          {
            retailerId,
            type: "debit",
            account: "Customer",
            amount: totalAmount,
            referenceId: invoiceId,
            description: "Sale"
          },
          {
            retailerId,
            type: "credit",
            account: "Sales",
            amount: totalAmount - (totalCGST + totalSGST),
            referenceId: invoiceId,
            description: "Revenue"
          },
          {
            retailerId,
            type: "credit",
            account: "CGST Payable",
            amount: totalCGST,
            referenceId: invoiceId,
            description: "CGST"
          },
          {
            retailerId,
            type: "credit",
            account: "SGST Payable",
            amount: totalSGST,
            referenceId: invoiceId,
            description: "SGST"
          }
        ],
        { session }
      )

    })

    return NextResponse.json(
      { message: "Sale completed successfully" },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("SALE ERROR:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )

  } finally {
    if (session) session.endSession()
  }
}