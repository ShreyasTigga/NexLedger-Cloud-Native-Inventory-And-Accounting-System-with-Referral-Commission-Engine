import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import PurchaseInvoice from "@/models/purchaseInvoice"
import StockMovement from "@/models/stockMovement"

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const { invoiceNumber, supplierName, items } =
      await req.json()

    // 🔴 Basic validation
    if (!invoiceNumber || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid invoice data" },
        { status: 400 }
      )
    }

    await session.withTransaction(async () => {
      let invoiceTotal = 0

      for (const entry of items) {
        const { productId, quantity, purchasePrice } = entry

        if (!productId || quantity <= 0 || purchasePrice <= 0) {
          throw new Error("Invalid item data")
        }

        const product = await Item.findById(productId).session(session)

        if (!product) {
          throw new Error("Product not found")
        }

        const oldQty = product.stockQuantity
        const oldCost = product.costPrice

        const totalQty = oldQty + quantity

        // 🔥 Weighted average cost
        let newCostPrice = purchasePrice

        if (oldQty > 0) {
          newCostPrice =
            ((oldQty * oldCost) + (quantity * purchasePrice)) /
            totalQty
        }

        // ✅ Update inventory
        await Item.findByIdAndUpdate(
          productId,
          {
            stockQuantity: totalQty,
            costPrice: newCostPrice
          },
          { session }
        )

        // ✅ Track stock movement
        await StockMovement.create(
          [
            {
              itemId: productId,
              type: "purchase",
              quantity,
              reference: invoiceNumber
            }
          ],
          { session }
        )

        invoiceTotal += quantity * purchasePrice
      }

      // ✅ Create invoice
      await PurchaseInvoice.create(
        [
          {
            invoiceNumber,
            supplierName,
            totalAmount: invoiceTotal,
            items
          }
        ],
        { session }
      )
    })

    return NextResponse.json(
      { message: "Purchase invoice created successfully" },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("PURCHASE ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  } finally {
    session.endSession()
  }
}

export async function GET(req: NextRequest) {
  await dbConnect()

  const { searchParams } = new URL(req.url)

  const page = Number(searchParams.get("page")) || 1
  const limit = 10
  const skip = (page - 1) * limit

  const invoices = await PurchaseInvoice.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await PurchaseInvoice.countDocuments()

  return NextResponse.json({
    invoices,
    totalPages: Math.ceil(total / limit)
  })
}