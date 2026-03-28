import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"

// CREATE ITEM
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()

    const name = body.name?.trim()
    const sku = body.sku?.trim()
    const barcode = body.barcode?.trim()
    const category = body.category?.trim()

    const {
      brand,
      unit,
      costPrice,
      sellingPrice,
      taxRate,
      reorderLevel
    } = body

    if (!name || !sku || !category || costPrice == null || sellingPrice == null) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      )
    }

    // SKU duplicate
    const existingSKU = await Item.findOne({ sku })
    if (existingSKU) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 }
      )
    }

    // Barcode duplicate
    if (barcode) {
      const existingBarcode = await Item.findOne({ barcode })
      if (existingBarcode) {
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
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

// GET (Search + Pagination)
export async function GET(req: NextRequest) {
  try {
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

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect()
    const { id } = await req.json()

    await Item.findByIdAndDelete(id)

    return NextResponse.json({ message: "Deleted" })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}

// UPDATE
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()

    const { id, sellingPrice, taxRate, updates } = await req.json()

    // Optional: protect SKU uniqueness on update
    if (updates.sku) {
      const existingSKU = await Item.findOne({
        sku: updates.sku,
        _id: { $ne: id }
      })

      if (existingSKU) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        )
      }
    }

    const updated = await Item.findByIdAndUpdate(id, updates, {
      new: true
    })

    const product = await Item.findByIdAndUpdate(
      id,
      {
        sellingPrice,
        taxRate
      },
      { new: true }
    )

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}