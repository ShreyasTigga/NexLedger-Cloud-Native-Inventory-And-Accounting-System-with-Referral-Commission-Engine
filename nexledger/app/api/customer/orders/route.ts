import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"
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

    // 🔐 ROLE
    if (user.role !== "customer") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // 🔐 TOKEN SAFETY
    if (!user.customerId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const customerId = user.customerId

    // 📦 FETCH ORDERS (no extra DB query)
    const orders = await SalesInvoice.find({
      customerId
    })
      .sort({ createdAt: -1 })
      .select("_id totalAmount status createdAt")
      .lean()

    // ✅ FORMAT RESPONSE
    const formatted = orders.map(order => ({
      id: order._id,
      totalAmount: order.totalAmount,
      status: order.status,
      date: order.createdAt
    }))

    return NextResponse.json({
      orders: formatted
    })

  } catch (err: any) {
    console.error("CUSTOMER ORDERS ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}