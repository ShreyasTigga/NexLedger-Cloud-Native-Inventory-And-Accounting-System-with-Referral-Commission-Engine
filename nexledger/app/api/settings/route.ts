import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import RetailerSettings from "@/models/retailerSettings"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  await dbConnect()

  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await RetailerSettings.findOne({
    retailerId: user.userId
  }).lean()

  return NextResponse.json(settings || { categories: [], units: [] })
}

export async function POST(req: NextRequest) {
  await dbConnect()

  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const updated = await RetailerSettings.findOneAndUpdate(
    { retailerId: user.userId },
    body,
    { upsert: true, new: true }
  )

  return NextResponse.json(updated)
}