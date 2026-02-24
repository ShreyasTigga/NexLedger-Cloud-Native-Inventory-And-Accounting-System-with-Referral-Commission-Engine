import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

// CREATE ITEM
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const {
      name,
      sku,
      barcode,
      category,
      brand,
      unit,
      costPrice,
      sellingPrice,
      taxRate,
      reorderLevel
    } = await req.json()

    if (!name || !sku || !category || !costPrice || !sellingPrice) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      )
    }

    // Check SKU duplicate
    const existingSKU = await Item.findOne({ sku })
    if (existingSKU) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 }
      )
    }

    // Check Barcode duplicate (if provided)
    if (barcode) {
      const barcodeExists = await Item.findOne({ barcode })
      if (barcodeExists) {
        return NextResponse.json(
          { error: "Barcode already exists" },
          { status: 400 }
        )
      }
    }

    const item = await Item.create({
      name,
      sku,
      barcode,
      category,
      brand,
      unit,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      taxRate: Number(taxRate) || 0,
      reorderLevel: Number(reorderLevel) || 5,
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

// GET (Search + Pagination)
export async function GET(req: NextRequest) {
  await dbConnect()

  const { searchParams } = new URL(req.url)

  const search = searchParams.get("search") || ""
  const page = Number(searchParams.get("page")) || 1
  const limit = 5
  const skip = (page - 1) * limit

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
          { barcode: { $regex: search, $options: "i" } }
        ]
      }
    : {}

  const products = await Item.find(query)
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Item.countDocuments(query)

  return NextResponse.json({
    products,
    totalPages: Math.ceil(total / limit)
  })
}

// DELETE
export async function DELETE(req: NextRequest) {
  await dbConnect()
  const { id } = await req.json()
  await Item.findByIdAndDelete(id)
  return NextResponse.json({ message: "Deleted" })
}

// UPDATE
export async function PUT(req: NextRequest) {
  await dbConnect()
  const { id, ...updates } = await req.json()

  const updated = await Item.findByIdAndUpdate(id, updates, {
    new: true
  })

  return NextResponse.json(updated)
}