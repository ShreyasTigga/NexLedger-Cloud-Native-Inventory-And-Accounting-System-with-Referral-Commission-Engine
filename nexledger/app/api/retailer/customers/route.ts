import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  await dbConnect()

  const user = await getUserFromRequest(req)

  if (!user || user.role !== "retailer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const customers = await Customer.find({
    retailerId: user.userId
  })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(customers)
}