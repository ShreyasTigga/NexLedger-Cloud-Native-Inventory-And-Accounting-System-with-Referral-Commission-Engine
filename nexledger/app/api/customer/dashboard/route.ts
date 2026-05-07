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

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!user.customerId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const customerId = user.customerId

    // ================= CUSTOMER =================
    const customer = await Customer.findById(customerId).lean()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // ================= ORDERS =================

    const totalOrders = await SalesInvoice.countDocuments({ customerId })

    const totalSpentAgg = await SalesInvoice.aggregate([
      { $match: { customerId } },
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
      { $match: { customerId } }, // ✅ FIXED
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ])

    const referralEarnings = referralAgg[0]?.total || 0
    const totalTransactions = referralAgg[0]?.count || 0

    // 📊 LEVEL STATS (NEW)
    const levelStats = await ReferralEarning.aggregate([
      { $match: { customerId } },
      {
        $group: {
          _id: "$level",
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // 🕒 RECENT ACTIVITY (NEW)
    const recentEarnings = await ReferralEarning.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("sourceCustomerId", "name phone")
      .lean()

    // ================= WALLET =================

    const walletBalance = customer.walletBalance || 0

    return NextResponse.json({
      // 💰 CORE
      walletBalance,
      referralEarnings,

      // 📦 ORDERS
      totalOrders,
      totalSpent,

      // 📊 ANALYTICS
      totalTransactions,
      levelStats,

      // 🕒 RECENT
      recentEarnings
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}