import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import Customer from "@/models/customer"
import SalesInvoice from "@/models/salesInvoice"
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

    const query = {
      retailerId: user.userId
    }

    const invoices = await SalesInvoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await SalesInvoice.countDocuments(query)

    return NextResponse.json({
      invoices,
      totalPages: Math.ceil(total / limit)
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

// ================= POST =================
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // 🔐 AUTH
    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items, customerId } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    await session.withTransaction(async () => {

      // 🔥 Validate customer
      const customer = await Customer.findById(customerId).session(session)

      if (!customer) {
        throw new Error("Customer not found")
      }

      let processedItems: any[] = []
      let totalAmount = 0
      let totalCGST = 0
      let totalSGST = 0

      // ================= ITEMS =================

      for (const item of items) {

        const product = await Item.findOne({
          _id: item.productId,
          retailerId: user.userId // 🔥 MULTI-TENANT
        }).session(session)

        if (!product) {
          throw new Error("Product not found or unauthorized")
        }

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
          gstAmount,
          total
        })

        // 🔻 Reduce stock
        await Item.findOneAndUpdate(
          {
            _id: product._id,
            retailerId: user.userId
          },
          { $inc: { stockQuantity: -item.quantity } },
          { session }
        )

        // 📦 Stock movement
        await StockMovement.create(
          [{
            retailerId: user.userId,
            itemId: product._id,
            type: "sale",
            quantity: -item.quantity,
            reference: "SALE"
          }],
          { session }
        )
      }

      // ================= INVOICE =================

      const invoice = await SalesInvoice.create(
        [{
          retailerId: user.userId, // 🔥 REQUIRED
          customerId,
          items: processedItems,
          totalAmount
        }],
        { session }
      )

      const invoiceId = invoice[0]._id

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
            retailerId: user.userId,
            type: "debit",
            account: "Customer",
            amount: totalAmount,
            referenceId: invoiceId,
            description: "Sale"
          },
          {
            retailerId: user.userId,
            type: "credit",
            account: "Sales",
            amount: totalAmount - (totalCGST + totalSGST),
            referenceId: invoiceId,
            description: "Revenue"
          },
          {
            retailerId: user.userId,
            type: "credit",
            account: "CGST Payable",
            amount: totalCGST,
            referenceId: invoiceId,
            description: "CGST"
          },
          {
            retailerId: user.userId,
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
    session.endSession()
  }
}