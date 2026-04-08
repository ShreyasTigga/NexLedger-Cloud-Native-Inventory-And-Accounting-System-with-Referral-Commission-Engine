import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const retailerId = searchParams.get("retailerId")

    if (!retailerId) {
      return NextResponse.json(
        { error: "Retailer ID required" },
        { status: 400 }
      )
    }

    const product = await Item.findOne(
      {
        _id: params.id,
        retailerId // 🔥 SECURITY FIX
      },
      {
        name: 1,
        sellingPrice: 1,
        stockQuantity: 1,
        category: 1,
        brand: 1
      }
    ).lean()

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}