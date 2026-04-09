import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = await ReferralConfig.findOne({
      retailerId: user.userId,
      isActive: true
    }).lean()

    return NextResponse.json(config)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}

// ================= CREATE / UPDATE =================
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const {
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale
    } = body

    // 🔴 Validation
    if (!levels || !percentages || percentages.length !== levels) {
      return NextResponse.json(
        { error: "Levels and percentages mismatch" },
        { status: 400 }
      )
    }

    // 🔥 deactivate old config (ONLY this retailer)
    await ReferralConfig.updateMany(
      {
        retailerId: user.userId,
        isActive: true
      },
      { isActive: false }
    )

    const config = await ReferralConfig.create({
      retailerId: user.userId, // 🔥 KEY FIX
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale,
      isActive: true
    })

    return NextResponse.json(config)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}