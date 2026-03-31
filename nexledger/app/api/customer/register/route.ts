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

    // Validation
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check existing user
    const existingUser = await Customer.findOne({
      $or: [{ email }, { phone }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Handle referral
    let referredById: mongoose.Types.ObjectId | undefined =
      undefined

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

    // Generate unique referral code
    let newReferralCode = generateReferralCode(name)

    while (
      await Customer.findOne({ referralCode: newReferralCode })
    ) {
      newReferralCode = generateReferralCode(name)
    }

    // Create customer
    const customer: any = await Customer.create({
      name,
      email,
      phone,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referredById,
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
    console.error(err)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}