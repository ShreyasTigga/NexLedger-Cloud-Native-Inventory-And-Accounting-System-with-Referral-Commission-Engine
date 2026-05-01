import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import WalletTransaction from "@/models/walletTransaction"
import Customer from "@/models/customer"
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

    const transactions = await WalletTransaction.find({
      customerId: customer._id
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json(transactions)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}