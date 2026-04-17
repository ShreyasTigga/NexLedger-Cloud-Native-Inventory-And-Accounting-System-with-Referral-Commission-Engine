import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    let retailerId

    // 🧠 CUSTOMER FLOW
    if (user.role === "customer") {
      const customer = await Customer.findOne(
        { userId: user.userId },
        { retailerId: 1 } // 🔥 optimized
      ).lean()

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

    const { searchParams } = new URL(req.url)

    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""

    const page = Number(searchParams.get("page")) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const query: any = {
      retailerId,
      stockQuantity: { $gt: 0 }
    }

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    if (category) {
      query.category = category
    }

    const products = await Item.find(query)
      .sort({ createdAt: -1 }) // 🔥 UX improvement
      .skip(skip)
      .limit(limit)
      .select("name sellingPrice stockQuantity category")
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