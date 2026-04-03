import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ReferralConfig from "@/models/referralConfig"

export async function GET() {
  await dbConnect()

  const config = await ReferralConfig.findOne({ isActive: true })

  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()

    const { levels, percentages } = body

    if (percentages.length !== levels) {
      return NextResponse.json(
        { error: "Levels and percentages mismatch" },
        { status: 400 }
      )
    }

    // 🔥 deactivate old config
    await ReferralConfig.updateMany(
      { isActive: true },
      { isActive: false }
    )

    const config = await ReferralConfig.create({
      ...body,
      isActive: true
    })

    return NextResponse.json(config)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}