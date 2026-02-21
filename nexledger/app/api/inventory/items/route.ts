import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

// CREATE ITEM
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { name, sku, costPrice, sellingPrice } = await req.json()

    if (!name || !sku || !costPrice || !sellingPrice) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    const existing = await Item.findOne({ sku })
    if (existing) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 }
      )
    }

    const item = await Item.create({
      name,
      sku,
      costPrice,
      sellingPrice,
      stockQuantity: 0
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    )
  }
}

// GET ALL ITEMS
export async function GET() {
  try {
    await dbConnect()

    const items = await Item.find().lean()

    return NextResponse.json(items)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    )
  }
}