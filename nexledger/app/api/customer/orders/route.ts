import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user || user.role !== "customer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔍 GET CUSTOMER
    const customer = await Customer.findOne({
      userId: user.userId
    }).lean()

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // 📦 FETCH ORDERS
    const orders = await SalesInvoice.find({
      customerId: customer._id
    })
      .sort({ createdAt: -1 })
      .select("_id totalAmount status createdAt")
      .lean()

    // ✅ FORMAT RESPONSE (clean for frontend)
    const formatted = orders.map(order => ({
      id: order._id,
      totalAmount: order.totalAmount,
      status: order.status,
      date: order.createdAt
    }))

    return NextResponse.json(formatted)

  } catch (err: any) {
    console.error("CUSTOMER ORDERS ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}