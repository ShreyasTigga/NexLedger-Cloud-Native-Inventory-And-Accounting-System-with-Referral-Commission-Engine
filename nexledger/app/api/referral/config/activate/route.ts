import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔐 ROLE CHECK
    if (user.role !== "retailer") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // 🔐 TOKEN SAFETY
    if (!user.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { configId } = body

    // 🔍 VALIDATION
    if (!configId || !mongoose.Types.ObjectId.isValid(configId)) {
      return NextResponse.json(
        { error: "Invalid configId" },
        { status: 400 }
      )
    }

    // 🔍 CHECK CONFIG EXISTS + BELONGS TO USER
    const config = await ReferralConfig.findOne({
      _id: configId,
      retailerId: user.userId
    })

    if (!config) {
      return NextResponse.json(
        { error: "Config not found" },
        { status: 404 }
      )
    }

    // ================= ACTIVATE LOGIC =================

    // 1️⃣ Deactivate all configs for this retailer
    await ReferralConfig.updateMany(
      { retailerId: user.userId },
      { isActive: false }
    )

    // 2️⃣ Activate selected config
    config.isActive = true
    await config.save()

    return NextResponse.json({
      message: "Config activated successfully",
      configId
    })

  } catch (err: any) {
    console.error("ACTIVATE CONFIG ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}