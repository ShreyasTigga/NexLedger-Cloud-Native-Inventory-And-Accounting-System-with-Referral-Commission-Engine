import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import mongoose from "mongoose"

// ================= UPDATE CONFIG =================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer" || !user.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid config ID" },
        { status: 400 }
      )
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

    // ================= EXISTING CONFIG =================
    const config = await ReferralConfig.findOne({
      _id: id,
      retailerId: user.userId
    })

    if (!config) {
      return NextResponse.json(
        { error: "Config not found" },
        { status: 404 }
      )
    }

    // ❌ Do not allow editing active config
    if (config.isActive) {
      return NextResponse.json(
        { error: "Cannot edit active config. Create new instead." },
        { status: 400 }
      )
    }

    // ================= LEVEL VALIDATION =================
    if (!Number.isInteger(levels) || levels <= 0) {
      return NextResponse.json(
        { error: "Levels must be a positive integer" },
        { status: 400 }
      )
    }

    // ================= PERCENTAGE VALIDATION =================
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

    if (total > 100 || total === 0) {
      return NextResponse.json(
        { error: "Invalid percentage total" },
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

    // ================= DISTRIBUTION VALIDATION =================
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

    // ================= FIXED COMMISSION VALIDATION =================
    if (commissionType === "fixed") {
      if (!maxCommissionPerSale || maxCommissionPerSale <= 0) {
        return NextResponse.json(
          { error: "Max commission required for fixed type" },
          { status: 400 }
        )
      }
    }

    // ================= DUPLICATE NAME CHECK =================
    const existing = await ReferralConfig.findOne({
      retailerId: user.userId,
      name: normalizedName,
      isDeleted: false,
      _id: { $ne: id }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Config name already exists" },
        { status: 400 }
      )
    }

    // ================= UPDATE =================
    const updated = await ReferralConfig.findOneAndUpdate(
      {
        _id: id,
        retailerId: user.userId
      },
      {
        name: normalizedName,
        levels,
        percentages,
        distributionPercentage,
        commissionType,
        maxCommissionPerSale
      },
      { new: true }
    )

    return NextResponse.json(updated)

  } catch (err: any) {
    console.error("UPDATE CONFIG ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}


// ================= DELETE CONFIG =================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer" || !user.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid config ID" },
        { status: 400 }
      )
    }

    const config = await ReferralConfig.findOne({
      _id: id,
      retailerId: user.userId
    })

    if (!config) {
      return NextResponse.json(
        { error: "Config not found" },
        { status: 404 }
      )
    }

    // ❌ Do not delete active config
    if (config.isActive) {
      return NextResponse.json(
        { error: "Cannot delete active config" },
        { status: 400 }
      )
    }

    // ✅ SOFT DELETE
    await ReferralConfig.findOneAndUpdate(
      {
        _id: id,
        retailerId: user.userId
      },
      {
        isDeleted: true,
        isActive: false
      }
    )

    return NextResponse.json({
      message: "Config deleted successfully"
    })

  } catch (err: any) {
    console.error("DELETE CONFIG ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}