import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import PurchaseInvoice from "@/models/purchaseInvoice"
import StockMovement from "@/models/stockMovement"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import Supplier from "@/models/supplier"

// ================= CREATE PURCHASE =================
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    let { invoiceNumber, supplierName, items } = body

    invoiceNumber = invoiceNumber?.trim()
    supplierName = supplierName?.trim()

    if (!invoiceNumber || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid invoice data" }, { status: 400 })
    }

    // 🔒 Prevent duplicate invoice number per retailer
    const existingInvoice = await PurchaseInvoice.findOne({
      invoiceNumber,
      retailerId: user.userId
    })

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice already exists" }, { status: 400 })
    }

    await session.withTransaction(async () => {
      let invoiceTotal = 0

      const processedItems: any[] = []

      // 🔥 Prevent duplicate product entries
      const seenProducts = new Set()

      for (const entry of items) {
        const { productId, quantity, purchasePrice } = entry

        if (
          !productId ||
          !mongoose.Types.ObjectId.isValid(productId) ||
          quantity <= 0 ||
          purchasePrice <= 0
        ) {
          throw new Error("Invalid item data")
        }

        if (seenProducts.has(productId)) {
          throw new Error("Duplicate product in invoice")
        }

        seenProducts.add(productId)

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

        let newCostPrice = purchasePrice

        if (oldQty > 0) {
          newCostPrice =
            ((oldQty * oldCost) + (quantity * purchasePrice)) / totalQty
        }

        const totalAmount = quantity * purchasePrice

        // 🔄 Update item
        await Item.findOneAndUpdate(
          { _id: productId, retailerId: user.userId },
          {
            stockQuantity: totalQty,
            costPrice: newCostPrice
          },
          { session }
        )

        // 📦 Stock movement
        await StockMovement.create(
          [
            {
              retailerId: user.userId,
              itemId: productId,
              type: "purchase",
              quantity,
              reference: invoiceNumber
            }
          ],
          { session }
        )

        processedItems.push({
          productId,
          productName: product.name,
          quantity,
          purchasePrice,
          totalAmount
        })

        invoiceTotal += totalAmount
      }

      // 🧾 Create invoice
      await PurchaseInvoice.create(
        [
          {
            retailerId: user.userId,
            invoiceNumber,
            supplierName,
            totalAmount: invoiceTotal,
            items: processedItems
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

    const user = await getUserFromRequest(req)

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

    const invoices = await PurchaseInvoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("invoiceNumber supplierName totalAmount createdAt items") 
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