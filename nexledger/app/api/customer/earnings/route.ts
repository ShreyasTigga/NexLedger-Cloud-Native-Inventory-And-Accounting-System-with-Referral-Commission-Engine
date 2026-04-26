import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralEarning from "@/models/referralEarning"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
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
    if (user.role !== "customer") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // 🔐 TOKEN SAFETY
    if (!user.customerId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const customerId = user.customerId

    const earnings = await ReferralEarning.find({
      customerId
    })
      .populate("sourceCustomerId", "name phone")
      .sort({ createdAt: -1 })
      .limit(50)
      .select("amount level createdAt sourceCustomerId")
      .lean()

    return NextResponse.json({
      earnings
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}