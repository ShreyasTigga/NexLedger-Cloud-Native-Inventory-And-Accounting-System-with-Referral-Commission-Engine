import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

export async function GET(req: NextRequest) {
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

    const products = await Item.find(
      {
        retailerId, // 🔥 MULTI-TENANT FIX
        stockQuantity: { $gt: 0 }
      },
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
      { error: err.message },
      { status: 500 }
    )
  }
}