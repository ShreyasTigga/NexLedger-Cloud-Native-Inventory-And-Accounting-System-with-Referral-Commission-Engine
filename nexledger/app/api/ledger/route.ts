import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import LedgerEntry from "@/models/ledgerEntry"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user || user.role !== "retailer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const entries = await LedgerEntry.find({
      retailerId: user.userId
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json(entries)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}