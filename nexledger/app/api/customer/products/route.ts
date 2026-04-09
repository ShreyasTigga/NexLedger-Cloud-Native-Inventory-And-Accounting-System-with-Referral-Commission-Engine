import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    const { searchParams } = new URL(req.url)

    const search = searchParams.get("search")
    const category = searchParams.get("category")

    const query: any = {
      retailerId
    }

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    if (category) {
      query.category = category
    }

    const products = await Item.find(query).lean()

    return NextResponse.json(products)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}