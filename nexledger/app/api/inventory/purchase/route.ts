import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import PurchaseInvoice from "@/models/purchaseInvoice"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { supplierId, invoiceNumber, items } = await req.json()

    if (!supplierId || !invoiceNumber || !items?.length) {
      return NextResponse.json(
        { error: "Invalid purchase data" },
        { status: 400 }
      )
    }

    let totalAmount = 0

    for (const entry of items) {
      if (!mongoose.Types.ObjectId.isValid(entry.itemId)) {
        return NextResponse.json(
          { error: "Invalid itemId" },
          { status: 400 }
        )
      }

      const item = await Item.findById(entry.itemId)
      if (!item) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 404 }
        )
      }

      // Increase stock
      await Item.findByIdAndUpdate(entry.itemId, {
        $inc: { stockQuantity: entry.quantity }
      })

      totalAmount += entry.quantity * entry.costPrice
    }

    const invoice = await PurchaseInvoice.create({
      supplierId,
      invoiceNumber,
      items,
      totalAmount
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    )
  }
}