import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import Purchase from "@/models/purchase"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()

    const productId = body.productId
    const quantity = Number(body.quantity)
    const purchasePrice = Number(body.purchasePrice)
    const supplierName = body.supplierName?.trim()

    // Basic validation
    if (!productId || quantity == null || purchasePrice == null) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      )
    }

    if (quantity <= 0 || purchasePrice <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity or price" },
        { status: 400 }
      )
    }

    // Check product exists
    const product = await Item.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Atomic stock increment
    await Item.findByIdAndUpdate(
      productId,
      { $inc: { stockQuantity: quantity } }
    )

    const totalAmount = quantity * purchasePrice

    // Save purchase record
    const purchase = await Purchase.create({
      productId,
      quantity,
      purchasePrice,
      totalAmount,
      supplierName
    })

    return NextResponse.json(purchase, { status: 201 })

  } catch (err: any) {
    console.error("PURCHASE ERROR:", err)
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}