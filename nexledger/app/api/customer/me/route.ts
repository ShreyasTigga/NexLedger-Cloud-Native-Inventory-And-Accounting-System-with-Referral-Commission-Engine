import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"

import Customer from "@/models/customer"
import ReferralEarning from "@/models/referralEarning"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user || user.role !== "customer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const customerId = user.customerId

    // ================= CUSTOMER =================
    const customer = await Customer.findById(customerId).lean()

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // ================= CHILDREN =================
    const children = await Customer.find({
      referredBy: customer._id
    })
      .select("name email referralCode")
      .lean()

    // ================= EARNINGS =================
    const earnings = await ReferralEarning.find({
      userId: customer._id
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json({
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        referralCode: customer.referralCode,
        walletBalance: customer.walletBalance,
        referredBy: customer.referredBy
      },
      children,
      earnings
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}