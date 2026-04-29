import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
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

    const customers = await Customer.find({
      retailerId: user.userId
    })
      .populate("userId", "name email phone")
      .populate({
        path: "referredBy",
        populate: {
          path: "userId",
          select: "name"
        }
      })
      .sort({ createdAt: -1 })
      .lean()

    const formatted = customers.map((c: any) => ({
      id: c._id,
      name: c.userId?.name || c.name,
      email: c.userId?.email,
      phone: c.userId?.phone,
      referralCode: c.referralCode,
      referredBy: c.referredBy?.userId?.name || null,
      type: c.referredBy ? "referral" : "manual"
    }))

    return NextResponse.json({
      customers: formatted
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}