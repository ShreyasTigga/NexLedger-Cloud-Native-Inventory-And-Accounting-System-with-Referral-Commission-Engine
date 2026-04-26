import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    let retailerId

    // 🧠 CUSTOMER FLOW
    if (user.role === "customer") {
      if (!user.retailerId) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }

      retailerId = user.retailerId
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

    const query: any = { retailerId }

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    if (category) {
      query.category = category
    }

    const products = await Item.find(query).lean()

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