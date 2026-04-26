import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"
import Customer from "@/models/customer"
import ReferralEarning from "@/models/referralEarning"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // AUTH
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    //  ROLE CHECK
    if (user.role !== "customer") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    if (!user.customerId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const customerId = user.customerId

    //  CUSTOMER DATA
    const customer = await Customer.findById(customerId)

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // ================= ORDERS =================

    const totalOrders = await SalesInvoice.countDocuments({
      customerId
    })

    const totalSpentAgg = await SalesInvoice.aggregate([
      {
        $match: { customerId }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ])

    const totalSpent = totalSpentAgg[0]?.total || 0

    // ================= REFERRAL =================

    const referralAgg = await ReferralEarning.aggregate([
      {
        $match: { userId: customerId }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ])

    const referralEarnings = referralAgg[0]?.total || 0

    // ================= WALLET =================

    const walletBalance = customer.walletBalance || 0

    return NextResponse.json({
      totalOrders,
      totalSpent,
      referralEarnings,
      walletBalance
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}