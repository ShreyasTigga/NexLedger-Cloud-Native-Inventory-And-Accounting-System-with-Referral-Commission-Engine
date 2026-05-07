import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import mongoose from "mongoose"

// ================= GET CONFIG =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "retailer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!user.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const configs = await ReferralConfig.find({
      retailerId: user.userId,
      isDeleted: false
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

// ================= CREATE CONFIG =================
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "retailer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!user.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()

    const {
      name,
      levels,
      percentages,
      distributionPercentage,
      commissionType,
      maxCommissionPerSale
    } = body

    // ================= NAME =================
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Config name is required" },
        { status: 400 }
      )
    }

    const normalizedName = name.trim().toLowerCase()

    // ================= LEVEL =================
    if (!Number.isInteger(levels) || levels <= 0) {
      return NextResponse.json(
        { error: "Levels must be a positive integer" },
        { status: 400 }
      )
    }

    // ================= PERCENTAGES =================
    if (!Array.isArray(percentages) || percentages.length !== levels) {
      return NextResponse.json(
        { error: "Invalid levels/percentages" },
        { status: 400 }
      )
    }

    if (!percentages.every((p: any) => typeof p === "number")) {
      return NextResponse.json(
        { error: "Percentages must be numbers" },
        { status: 400 }
      )
    }

    const total = percentages.reduce((a: number, b: number) => a + b, 0)

    if (total > 100) {
      return NextResponse.json(
        { error: "Total percentage cannot exceed 100%" },
        { status: 400 }
      )
    }

    if (total === 0) {
      return NextResponse.json(
        { error: "Total percentage cannot be 0" },
        { status: 400 }
      )
    }

    const invalid = percentages.some(
      (p: number) => p < 0 || p > 100
    )

    if (invalid) {
      return NextResponse.json(
        { error: "Invalid percentage values" },
        { status: 400 }
      )
    }

    // ================= DISTRIBUTION =================
    if (
      distributionPercentage === undefined ||
      distributionPercentage < 0 ||
      distributionPercentage > 100
    ) {
      return NextResponse.json(
        { error: "Invalid distribution percentage" },
        { status: 400 }
      )
    }

    // ================= FIXED COMMISSION =================
    if (commissionType === "fixed") {
      if (!maxCommissionPerSale || maxCommissionPerSale <= 0) {
        return NextResponse.json(
          { error: "Max commission required for fixed type" },
          { status: 400 }
        )
      }
    }

    // ================= DUPLICATE CHECK =================
    const existing = await ReferralConfig.findOne({
      retailerId: user.userId,
      name: normalizedName,
      isDeleted: false
    })

    if (existing) {
      return NextResponse.json(
        { error: "Config name already exists" },
        { status: 400 }
      )
    }

    // ================= TRANSACTION START =================
    await session.startTransaction()

    // deactivate existing
    await ReferralConfig.updateMany(
      { retailerId: user.userId, isActive: true },
      { $set: { isActive: false } },
      { session }
    )

    // create new config
    const [config] = await ReferralConfig.create(
      [
        {
          retailerId: user.userId,
          name: normalizedName,
          levels,
          percentages,
          distributionPercentage,
          commissionType: commissionType ?? "percentage",
          maxCommissionPerSale,
          isActive: true
        }
      ],
      { session }
    )

    await session.commitTransaction()
    session.endSession()

    return NextResponse.json(config)

  } catch (err: any) {
    await session.abortTransaction()
    session.endSession()

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}