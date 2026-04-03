import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// Generate referral code
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
        { error: "Name and password are required" },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      )
    }

    const existingUser = await Customer.findOne({
      $or: [{ email }, { phone }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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

    // Unique referral code
    let newReferralCode = generateReferralCode(name)

    while (
      await Customer.findOne({ referralCode: newReferralCode })
    ) {
      newReferralCode = generateReferralCode(name)
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      password: hashedPassword,
      referralCode: newReferralCode,
      ...(referredById && { referredBy: referredById }),
      walletBalance: 0
    })

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          referralCode: customer.referralCode
        }
      },
      { status: 201 }
    )

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}