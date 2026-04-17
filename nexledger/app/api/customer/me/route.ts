import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"

import Customer from "@/models/customer"
import ReferralEarning from "@/models/referralEarning"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

type PopulatedUser = {
  _id: string
  name: string
  email?: string
  phone?: string
}

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

    const customerId = user.customerId

    // ================= CUSTOMER =================
    const customer = await Customer.findById(customerId)
      .populate("userId", "name email phone")
      .lean()

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    const userData = customer.userId as unknown as PopulatedUser

    // ================= CHILDREN =================
    const childrenRaw = await Customer.find({
      referredBy: customer._id
    })
      .populate("userId", "name email")
      .select("userId referralCode")
      .lean()

    const children = childrenRaw.map((child) => {
      const userData = child.userId as unknown as PopulatedUser

      return {
        id: child._id,
        name: userData?.name,
        email: userData?.email,
        referralCode: child.referralCode
      }
    })

    // ================= EARNINGS =================
    const earnings = await ReferralEarning.find({
      userId: customer._id
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    // ================= RESPONSE =================
    return NextResponse.json({
      user: {
        id: customer._id,
        name: userData?.name,
        email: userData?.email,
        phone: userData?.phone,
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