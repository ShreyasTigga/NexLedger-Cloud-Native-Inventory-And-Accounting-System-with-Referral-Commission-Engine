import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Item from "@/models/item"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔴 Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

    let retailerId

    // 🧠 CUSTOMER FLOW
    if (user.role === "customer") {
      const customer = await Customer.findOne({
        userId: user.userId
      })

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        )
      }

      retailerId = customer.retailerId
    }

    // 🧠 RETAILER FLOW
    else if (user.role === "retailer") {
      retailerId = user.userId
    }

    else {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 403 }
      )
    }

    const product = await Item.findOne(
      {
        _id: params.id,
        retailerId // 🔥 SECURE
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

    return NextResponse.json(product)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}