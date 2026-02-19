import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

export async function POST(req: NextRequest) {
  await dbConnect()

  const { name, sku, costPrice, sellingPrice } = await req.json()

  if (!name || !sku || !costPrice || !sellingPrice) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 })
  }

  const existing = await Item.findOne({ sku })
  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
  }

  const item = await Item.create({
    name,
    sku,
    costPrice,
    sellingPrice
  })

  return NextResponse.json(item)
}

export async function GET() {
  await dbConnect()

  const items = await Item.find().lean()
  return NextResponse.json(items)
}
