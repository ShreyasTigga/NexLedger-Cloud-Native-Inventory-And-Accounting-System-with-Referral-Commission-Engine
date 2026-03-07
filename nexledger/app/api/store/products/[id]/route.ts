import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const product = await Item.findById(params.id, {
      name: 1,
      sellingPrice: 1,
      stockQuantity: 1,
      category: 1,
      brand: 1
    }).lean()

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}