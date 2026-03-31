import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import Customer from "@/models/customer"
import SalesInvoice from "@/models/salesInvoice"
import StockMovement from "@/models/stockMovement"
import LedgerEntry from "@/models/ledgerEntry"
import { processReferralCommission } from "@/lib/referralService"

// ================= GET =================

export async function GET(req: NextRequest) {
  await dbConnect()

  const { searchParams } = new URL(req.url)

  const page = Number(searchParams.get("page")) || 1
  const limit = 10
  const skip = (page - 1) * limit

  const invoices = await SalesInvoice.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await SalesInvoice.countDocuments()

  return NextResponse.json({
    invoices,
    totalPages: Math.ceil(total / limit)
  })
}

// ================= POST =================

type ProcessedItem = {
  itemId: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
  taxRate: number
  cgst: number
  sgst: number
  gstAmount: number
  total: number
}

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const { items, customerId } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    await session.withTransaction(async () => {

      // 🔥 Validate customer
      const customer = await Customer.findById(customerId).session(session)

      if (!customer) {
        throw new Error("Customer not found")
      }

      let processedItems: ProcessedItem[] = []
      let totalAmount = 0
      let totalCGST = 0
      let totalSGST = 0

      // ================= ITEM LOOP =================

      for (const item of items) {

        if (!item.productId || item.quantity <= 0) {
          throw new Error("Invalid item data")
        }

        const product = await Item.findById(item.productId).session(session)

        if (!product) {
          throw new Error("Product not found")
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
        await Item.findByIdAndUpdate(
          product._id,
          { $inc: { stockQuantity: -item.quantity } },
          { session }
        )

        // 📦 Stock movement
        await StockMovement.create(
          [
            {
              itemId: product._id,
              type: "sale",
              quantity: -item.quantity,
              reference: "SALE"
            }
          ],
          { session }
        )
      }

      // ================= CREATE INVOICE =================

      const invoice = await SalesInvoice.create(
        [
          {
            customerId,
            referredBy: customer.referredBy, // ✅ FIXED
            items: processedItems,
            totalAmount
          }
        ],
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
            type: "debit",
            account: "Customer",
            amount: totalAmount,
            referenceId: invoiceId,
            description: "Sale"
          },
          {
            type: "credit",
            account: "Sales",
            amount: totalAmount - (totalCGST + totalSGST),
            referenceId: invoiceId,
            description: "Sale Revenue"
          },
          {
            type: "credit",
            account: "CGST Payable",
            amount: totalCGST,
            referenceId: invoiceId,
            description: "CGST"
          },
          {
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
      { error: err.message || "Server error" },
      { status: 500 }
    )

  } finally {
    session.endSession()
  }
}