import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import mongoose from "mongoose"

// ================= UPDATE CONFIG =================
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // 🔍 VALIDATION
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid config ID" },
        { status: 400 }
      )
    }

    const body = await req.json()

    const {
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale
    } = body

    // 🔍 BUSINESS VALIDATION
    if (!levels || !percentages || percentages.length !== levels) {
      return NextResponse.json(
        { error: "Invalid levels/percentages" },
        { status: 400 }
      )
    }

    // 🔍 UPDATE
    const updated = await ReferralConfig.findOneAndUpdate(
      {
        _id: id,
        retailerId: user.userId // 🔐 ensures ownership
      },
      {
        levels,
        percentages,
        commissionType,
        maxCommissionPerSale
      },
      { new: true }
    )

    if (!updated) {
      return NextResponse.json(
        { error: "Config not found" },
        { status: 404 }
      )
    }

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
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // 🔍 VALIDATION
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid config ID" },
        { status: 400 }
      )
    }

    // 🔍 CHECK EXISTENCE
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

    // ⚠️ PREVENT DELETING ACTIVE CONFIG (important rule)
    if (config.isActive) {
      return NextResponse.json(
        { error: "Cannot delete active config" },
        { status: 400 }
      )
    }

    await ReferralConfig.deleteOne({
      _id: id,
      retailerId: user.userId
    })

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