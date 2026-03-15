import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

export async function GET(req: NextRequest) {

  await dbConnect()

  const { searchParams } = new URL(req.url)

  const search = searchParams.get("search")
  const category = searchParams.get("category")

  const query: any = {}

  if (search) {
    query.name = { $regex: search, $options: "i" }
  }

  if (category) {
    query.category = category
  }

  const products = await Item.find(query)

  return NextResponse.json(products)
}