import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import ReferralEarning from "@/models/referralEarning"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customer = await Customer.findOne({
      userId: user.userId
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const earnings = await ReferralEarning.find({
      userId: customer._id
    }).sort({ createdAt: -1 })

    return NextResponse.json(earnings)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}