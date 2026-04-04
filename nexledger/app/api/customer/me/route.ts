import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"

import Customer from "@/models/customer"
import ReferralEarning from "@/models/referralEarning"
import { verifyToken } from "@/lib/jwt"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const decoded: any = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // ================= USER =================
    const user = await Customer.findById(userId).lean()

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // ================= CHILDREN =================
    const children = await Customer.find({
      referredBy: user._id
    })
      .select("name email")
      .lean()

    // ================= EARNINGS =================
    const earnings = await ReferralEarning.find({
      userId: user._id
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance,
        referredBy: user.referredBy
      },
      children,
      earnings
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}