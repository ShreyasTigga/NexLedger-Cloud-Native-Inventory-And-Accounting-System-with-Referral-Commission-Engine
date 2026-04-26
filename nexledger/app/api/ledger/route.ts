import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import LedgerEntry from "@/models/ledgerEntry"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
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

    const entries = await LedgerEntry.find({
      retailerId: new mongoose.Types.ObjectId(user.userId)
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