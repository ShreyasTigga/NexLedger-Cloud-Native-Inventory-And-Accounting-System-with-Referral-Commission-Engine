import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import StockMovement from "@/models/stockMovement"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  await dbConnect()

  const user = await getUserFromRequest(req)

  if (!user || user.role !== "retailer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("itemId")

  const query: any = {
    retailerId: user.userId
  }

  if (itemId) query.itemId = itemId

  const movements = await StockMovement.find(query)
    .populate("itemId", "name")
    .sort({ createdAt: 1 }) // 🔥 IMPORTANT (ascending for balance flow)
    .lean()

  return NextResponse.json({ movements })
}