import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "customer" || !user.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customerId = user.customerId

    // ================= CURRENT USER =================
    const current = await Customer.findById(customerId)
      .populate("referredBy", "name phone")
      .lean()

    if (!current) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // ================= DOWNLINE =================
    const referrals = await Customer.find({
      referredBy: customerId
    })
      .select("name phone level createdAt")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      referredBy: current.referredBy || null,
      referrals
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}