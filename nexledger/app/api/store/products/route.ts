import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

export async function GET() {
  try {
    await dbConnect()

    const products = await Item.find(
      { stockQuantity: { $gt: 0 } }, // only available products
      {
        name: 1,
        sellingPrice: 1,
        stockQuantity: 1,
        category: 1
      }
    ).lean()

    return NextResponse.json(products)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}