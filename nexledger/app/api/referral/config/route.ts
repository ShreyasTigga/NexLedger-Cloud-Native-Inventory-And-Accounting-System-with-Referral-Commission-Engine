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

    // ✅ FIX: get config for THIS retailer
    const config = await ReferralConfig.findOne({
      retailerId: user.userId,
      isActive: true
    })

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

    // ✅ FIX: update ONLY this retailer
    const config = await ReferralConfig.findOneAndUpdate(
      { retailerId: user.userId },
      {
        retailerId: user.userId, // ✅ IMPORTANT
        levels,
        percentages,
        commissionType,
        maxCommissionPerSale,
        isActive: true
      },
      {
        upsert: true, // create if not exists
        new: true
      }
    )

    return NextResponse.json(config)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}