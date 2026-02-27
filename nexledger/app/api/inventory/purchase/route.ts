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

    // Get existing product
    const product = await Item.findById(productId)

    if (!product) {
      return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
      ) 
    }

    const oldQty = product.stockQuantity
    const oldCost = product.costPrice

    const newQty = Number(quantity)
    const newRate = Number(purchasePrice)

    const totalQty = oldQty + newQty

    // Weighted average calculation
    let newCostPrice = newRate

    if (oldQty > 0) {
      newCostPrice =
      ((oldQty * oldCost) + (newQty * newRate)) / totalQty
    }

    // Update stock + cost together
    await Item.findByIdAndUpdate(productId, {
      stockQuantity: totalQty,
      costPrice: newCostPrice
    })

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

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get("page")) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const purchases = await Purchase.find()
      .populate("productId", "name sku")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Purchase.countDocuments()

    return NextResponse.json({
      purchases,
      totalPages: Math.ceil(total / limit)
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}