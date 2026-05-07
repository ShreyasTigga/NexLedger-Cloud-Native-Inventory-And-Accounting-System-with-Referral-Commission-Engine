import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import WalletTransaction from "@/models/walletTransaction"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "customer" || !user.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customerId = user.customerId

    // 🔥 PAGINATION PARAMS
    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 20

    const skip = (page - 1) * limit

    const transactions = await WalletTransaction.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    return NextResponse.json({
      transactions,
      page,
      limit
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}