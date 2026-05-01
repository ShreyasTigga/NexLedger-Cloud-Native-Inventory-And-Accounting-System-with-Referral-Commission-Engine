import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import PurchaseInvoice from "@/models/purchaseInvoice"
import StockMovement from "@/models/stockMovement"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import Supplier from "@/models/supplier"
import LedgerEntry from "@/models/ledgerEntry"

// ================= CREATE PURCHASE =================
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "retailer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!user.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    let { invoiceNumber, supplierId, items } = body

    invoiceNumber = invoiceNumber?.trim()

    if (!invoiceNumber || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid invoice data" }, { status: 400 })
    }

    if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
      return NextResponse.json({ error: "Invalid supplier" }, { status: 400 })
    }

    const supplier = await Supplier.findById(supplierId).lean()
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const existingInvoice = await PurchaseInvoice.findOne({
      invoiceNumber,
      retailerId: user.userId
    }).lean()

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice already exists" }, { status: 400 })
    }

    await session.withTransaction(async () => {

      let invoiceTotal = 0
      const processedItems: any[] = []
      const stockMovements: any[] = []
      const itemUpdates: any[] = []
      const seenProducts = new Set()

      // ================= PROCESS ITEMS =================
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
          throw new Error("Product not found")
        }

        const oldQty = product.stockQuantity || 0
        const oldCost = product.costPrice || 0
        const newQty = oldQty + quantity

        const newCostPrice =
          oldQty > 0
            ? ((oldQty * oldCost) + (quantity * purchasePrice)) / newQty
            : purchasePrice

        const totalAmount = quantity * purchasePrice

        invoiceTotal += totalAmount

        // 📦 Prepare item update
        itemUpdates.push({
          productId,
          newQty,
          newCostPrice
        })

        // 📜 Prepare stock movement
        stockMovements.push({
          productId,
          quantity,
          purchasePrice,
          totalAmount,
          stockAfter: newQty
        })

        processedItems.push({
          productId,
          productName: product.name,
          quantity,
          purchasePrice,
          totalAmount
        })
      }

      // ================= TRANSACTION ID =================
      const transactionId = new mongoose.Types.ObjectId().toString()

      // ================= CREATE INVOICE =================
      const purchase = await PurchaseInvoice.create(
        [
          {
            retailerId: user.userId,
            invoiceNumber,
            transactionId,
            supplierId,
            supplierName: supplier.name,
            items: processedItems,
            subtotal: invoiceTotal,
            totalAmount: invoiceTotal
          }
        ],
        { session }
      )

      const createdPurchase = purchase[0]

      // ================= STOCK MOVEMENT =================
      for (const move of stockMovements) {
        await StockMovement.create(
          [
            {
              retailerId: user.userId,
              itemId: move.productId,

              type: "purchase",
              direction: "in",

              transactionId,

              quantity: move.quantity,
              price: move.purchasePrice,      // ✅ FIXED
              totalAmount: move.totalAmount,  // ✅ FIXED

              referenceId: createdPurchase._id,
              referenceModel: "Purchase",

              stockAfter: move.stockAfter
            }
          ],
          { session }
        )
      }

      // ================= UPDATE ITEMS =================
      for (const update of itemUpdates) {
        await Item.findOneAndUpdate(
          { _id: update.productId, retailerId: user.userId },
          {
            stockQuantity: update.newQty,
            costPrice: update.newCostPrice
          },
          { session }
        )
      }

      // ================= ACCOUNTING LEDGER =================
      await LedgerEntry.insertMany(
        [
          {
            retailerId: user.userId,
            transactionId,
            account: "Inventory",
            accountType: "asset",
            type: "debit",
            amount: invoiceTotal,
            referenceId: createdPurchase._id,
            referenceModel: "Purchase",
            description: "Stock purchase"
          },
          {
            retailerId: user.userId,
            transactionId,
            account: "Cash",
            accountType: "asset",
            type: "credit",
            amount: invoiceTotal,
            referenceId: createdPurchase._id,
            referenceModel: "Purchase",
            description: "Payment made"
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

    if (!user || user.role !== "retailer" || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get("page")) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const query = { retailerId: user.userId }

    const invoices = await PurchaseInvoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("supplierId", "name")
      .select("invoiceNumber supplierId totalAmount createdAt items")
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