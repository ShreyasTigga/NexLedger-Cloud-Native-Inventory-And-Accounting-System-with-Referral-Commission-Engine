import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"

import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer" || !user.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const retailerId = new mongoose.Types.ObjectId(user.userId)

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    if (!search.trim()) {
      return NextResponse.json({ products: [] })
    }

    // 🔥 1. TRY EXACT BARCODE MATCH (FAST PATH)
    const barcodeMatch = await Item.findOne({
      retailerId,
      barcode: search,
      stockQuantity: { $gt: 0 },
      isActive: true
    })
      .select("_id name sellingPrice stockQuantity barcode")
      .lean()

    if (barcodeMatch) {
      return NextResponse.json({
        products: [barcodeMatch]
      })
    }

    // 🔥 2. FALLBACK TO NAME SEARCH
    const products = await Item.find({
      retailerId,
      stockQuantity: { $gt: 0 },
      isActive: true,
      name: { $regex: search, $options: "i" }
    })
      .limit(10)
      .select("_id name sellingPrice stockQuantity barcode")
      .lean()

    return NextResponse.json({
      products
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}