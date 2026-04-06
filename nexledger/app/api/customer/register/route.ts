import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import Customer from "@/models/customer"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

// referral code generator
function generateReferralCode(name: string) {
  const random = Math.floor(1000 + Math.random() * 9000)
  return name.substring(0, 3).toUpperCase() + random
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { name, email, phone, password, referralCode } =
      await req.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password required" },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone required" },
        { status: 400 }
      )
    }

    // 🔍 Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // 🔥 Create USER
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "customer"
    })

    // 🔗 Handle referral
    let referredById: mongoose.Types.ObjectId | undefined

    if (referralCode) {
      const parent = await Customer.findOne({ referralCode })

      if (!parent) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 400 }
        )
      }

      referredById = parent._id
    }

    // 🔁 Unique referral code
    let newReferralCode = generateReferralCode(name)

    while (
      await Customer.findOne({ referralCode: newReferralCode })
    ) {
      newReferralCode = generateReferralCode(name)
    }

    // 🔥 Create CUSTOMER
    await Customer.create({
      userId: user._id,
      referralCode: newReferralCode,
      ...(referredById && { referredBy: referredById }),
      walletBalance: 0
    })

    return NextResponse.json(
      {
        message: "Customer registered successfully"
      },
      { status: 201 }
    )

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}