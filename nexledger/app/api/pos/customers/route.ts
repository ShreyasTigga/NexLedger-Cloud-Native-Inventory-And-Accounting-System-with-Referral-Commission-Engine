import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"

import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user || user.role !== "retailer" || !user.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const retailerId = new mongoose.Types.ObjectId(user.userId)

    const { searchParams } = new URL(req.url)
    const search = (searchParams.get("search") || "").trim()

    if (!search) {
      return NextResponse.json([])
    }

    // 🔍 SEARCH BY NAME OR PHONE
    const customers = await Customer.find({
      retailerId,
      isActive: true,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ]
    })
      .limit(10)
      .select("_id name phone")
      .lean()

    return NextResponse.json(customers)

  } catch (err: any) {
    console.error("CUSTOMER SEARCH ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}