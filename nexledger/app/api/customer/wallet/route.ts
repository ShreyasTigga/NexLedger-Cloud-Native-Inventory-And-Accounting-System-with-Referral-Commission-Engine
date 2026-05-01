import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import ReferralEarning from "@/models/referralEarning"
import WalletTransaction from "@/models/walletTransaction" // ✅ NEW
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

    // ================= CUSTOMER =================
    const customer = await Customer.findById(customerId)
      .select("walletBalance totalEarnings")
      .lean()

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // ================= RECENT EARNINGS =================
    const recentEarnings = await ReferralEarning.find({
      customerId
    })
      .populate("sourceCustomerId", "name phone")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("amount level createdAt sourceCustomerId")
      .lean()

    // ================= WALLET TRANSACTIONS =================
    const transactions = await WalletTransaction.find({
      customerId
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("type source amount balanceAfter createdAt")
      .lean()

    // ================= RESPONSE =================
    return NextResponse.json({
      walletBalance: customer.walletBalance || 0,
      totalEarnings: customer.totalEarnings || 0,
      recentEarnings,
      transactions
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}