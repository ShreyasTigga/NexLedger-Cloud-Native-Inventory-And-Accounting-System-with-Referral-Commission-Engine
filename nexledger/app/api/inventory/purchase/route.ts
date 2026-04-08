import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import PurchaseInvoice from "@/models/purchaseInvoice"
import StockMovement from "@/models/stockMovement"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

// ================= CREATE PURCHASE =================
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user || user.role !== "retailer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { invoiceNumber, supplierName, items } = await req.json()

    // 🔴 Validation
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

        // 🔒 Ensure product belongs to retailer
        const product = await Item.findOne({
          _id: productId,
          retailerId: user.userId
        }).session(session)

        if (!product) {
          throw new Error("Product not found or unauthorized")
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
        await Item.findOneAndUpdate(
          {
            _id: productId,
            retailerId: user.userId
          },
          {
            stockQuantity: totalQty,
            costPrice: newCostPrice
          },
          { session }
        )

        // ✅ Stock movement
        await StockMovement.create(
          [
            {
              retailerId: user.userId, // 🔥 REQUIRED
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

      // ✅ Create purchase invoice
      await PurchaseInvoice.create(
        [
          {
            retailerId: user.userId, // 🔥 REQUIRED
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

// ================= GET PURCHASES =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user || user.role !== "retailer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get("page")) || 1
    const limit = 10
    const skip = (page - 1) * limit

    // 🔥 FILTER BY RETAILER
    const query = {
      retailerId: user.userId
    }

    const invoices = await PurchaseInvoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await PurchaseInvoice.countDocuments(query)

    return NextResponse.json({
      invoices,
      totalPages: Math.ceil(total / limit)
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}