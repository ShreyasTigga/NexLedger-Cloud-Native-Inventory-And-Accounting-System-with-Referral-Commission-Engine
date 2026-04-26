import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const { id } = await params

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔴 Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

    let retailerId: mongoose.Types.ObjectId

    // 🧠 CUSTOMER FLOW
    if (user.role === "customer") {
      if (!user.customerId || !user.retailerId) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }

      retailerId = new mongoose.Types.ObjectId(user.retailerId)
    }

    // 🧠 RETAILER FLOW
    else if (user.role === "retailer") {
      if (!user.userId) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }

      retailerId = new mongoose.Types.ObjectId(user.userId)
    }

    else {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // 🔥 SECURE PRODUCT FETCH
    const product = await Item.findOne(
      {
        _id: id,
        retailerId
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
        { error: "Product not found or unauthorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      product
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}