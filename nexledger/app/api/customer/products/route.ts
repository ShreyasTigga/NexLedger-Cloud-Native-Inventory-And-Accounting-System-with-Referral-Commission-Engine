import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

export async function GET(req: NextRequest) {
  await dbConnect()

  const { searchParams } = new URL(req.url)

  const search = searchParams.get("search")
  const category = searchParams.get("category")
  const retailerId = searchParams.get("retailerId") // 🔥 REQUIRED

  if (!retailerId) {
    return NextResponse.json(
      { error: "Retailer ID required" },
      { status: 400 }
    )
  }

  const query: any = {
    retailerId
  }

  if (search) {
    query.name = { $regex: search, $options: "i" }
  }

  if (category) {
    query.category = category
  }

  const products = await Item.find(query)

  return NextResponse.json(products)
}