import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

// ================= GET CONFIG =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🔐 ROLE
    if (user.role !== "retailer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 🔐 TOKEN SAFETY
    if (!user.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const configs = await ReferralConfig.find({
      retailerId: user.userId
    })
    .sort({ createdAt: -1 })
    .lean()

    return NextResponse.json(configs)

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

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🔐 ROLE
    if (user.role !== "retailer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 🔐 TOKEN SAFETY
    if (!user.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()

    const {
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale
    } = body

    if (!levels || !percentages || percentages.length !== levels) {
      return NextResponse.json(
        { error: "Invalid levels/percentages" },
        { status: 400 }
      )
    }

    const config = await ReferralConfig.create({
      retailerId: user.userId,
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale,
      isActive: false 
    })

    return NextResponse.json(config)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}