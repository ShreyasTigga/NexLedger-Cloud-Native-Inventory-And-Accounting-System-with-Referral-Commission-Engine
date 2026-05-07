import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user || user.role !== "retailer" || !user.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
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

    // 🔍 CHECK CONFIG (NOT DELETED)
    const config = await ReferralConfig.findOne({
      _id: configId,
      retailerId: user.userId,
      isDeleted: false
    })

    if (!config) {
      return NextResponse.json(
        { error: "Config not found" },
        { status: 404 }
      )
    }

    // ✅ Already active → skip
    if (config.isActive) {
      return NextResponse.json({
        message: "Config already active",
        configId
      })
    }

    // ================= ATOMIC SWITCH =================
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1️⃣ Deactivate current active config
      await ReferralConfig.updateMany(
        {
          retailerId: user.userId,
          isActive: true,
          isDeleted: false
        },
        { isActive: false },
        { session }
      )

      // 2️⃣ Activate selected config
      await ReferralConfig.updateOne(
        {
          _id: configId,
          retailerId: user.userId
        },
        { isActive: true },
        { session }
      )

      await session.commitTransaction()
      session.endSession()

    } catch (err) {
      await session.abortTransaction()
      session.endSession()
      throw err
    }

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