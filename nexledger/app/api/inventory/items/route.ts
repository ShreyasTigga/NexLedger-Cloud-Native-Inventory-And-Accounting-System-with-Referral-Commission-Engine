import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import mongoose from "mongoose"
import "@/models/supplier"
import Supplier from "@/models/supplier"

// ================= CREATE =================
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const name = body.name?.trim()
    const sku = body.sku?.trim()
    const barcode = body.barcode?.trim()
    const category = body.category?.trim()

    const { brand, unit, costPrice, sellingPrice, taxRate, reorderLevel } = body

    // ✅ ADDED: supplier input (no change to existing destructuring)
    const defaultSupplierId = body.defaultSupplierId

    if (!name || !sku || !category || costPrice == null || sellingPrice == null) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // ✅ ADDED: validate supplierId (safe check)
    if (defaultSupplierId && !mongoose.Types.ObjectId.isValid(defaultSupplierId)) {
      return NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 })
    }

    const existingSKU = await Item.findOne({
      sku,
      retailerId: user.userId
    })

    if (existingSKU) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    if (barcode) {
      const existingBarcode = await Item.findOne({
        barcode,
        retailerId: user.userId
      })

      if (existingBarcode) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 400 })
      }
    }

    const item = await Item.create({
      retailerId: user.userId,
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
      stockQuantity: 0,

      // ✅ ADDED: supplier saved
      defaultSupplierId: defaultSupplierId || undefined
    })

    return NextResponse.json(item, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    const search = searchParams.get("search") || ""
    const page = Number(searchParams.get("page")) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const query: any = {
      retailerId: user.userId
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } }
      ]
    }

    const products = await Item.find(query)
      .populate("defaultSupplierId", "name")
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .select("name sku category sellingPrice taxRate stockQuantity defaultSupplierId")
      .lean()

    const total = await Item.countDocuments(query)

    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / limit)
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ================= DELETE =================
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const item = await Item.findOneAndDelete({
      _id: id,
      retailerId: user.userId
    })

    if (!item) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Deleted" })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ================= UPDATE =================
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, updates } = await req.json()

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    if (updates.sku) {
      const existingSKU = await Item.findOne({
        sku: updates.sku,
        retailerId: user.userId,
        _id: { $ne: id }
      })

      if (existingSKU) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
      }
    }

    const updated = await Item.findOneAndUpdate(
      {
        _id: id,
        retailerId: user.userId
      },
      updates,
      { new: true }
    )

    if (!updated) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json(updated)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}