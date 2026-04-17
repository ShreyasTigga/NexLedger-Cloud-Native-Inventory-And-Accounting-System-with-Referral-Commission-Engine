import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

// ================= GET CONFIG =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = await ReferralConfig.findOne({ isActive: true })

    return NextResponse.json(config)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

// ================= UPDATE CONFIG =================
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const {
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale,
      isActive
    } = body

    if (!levels || !percentages || percentages.length !== levels) {
      return NextResponse.json(
        { error: "Invalid levels/percentages" },
        { status: 400 }
      )
    }

    // 🔥 deactivate old config
    await ReferralConfig.updateMany(
      { isActive: true },
      { isActive: false }
    )

    // 🔥 create new config
    const newConfig = await ReferralConfig.create({
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale,
      isActive: true
    })

    return NextResponse.json(newConfig)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}