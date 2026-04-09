import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import Customer from "@/models/customer"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

// 🔧 Generate referral code
function generateReferralCode(name: string) {
  const random = Math.floor(1000 + Math.random() * 9000)
  return name.substring(0, 3).toUpperCase() + random
}

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const body = await req.json()

    let { name, email, phone, password, referralCode, retailerId: inputRetailerId } = body

    // 🔥 Normalize
    email = email?.toLowerCase().trim()
    phone = phone?.trim()
    name = name?.trim()

    // 🔴 VALIDATION
    if (!name || !password) {
      return NextResponse.json({ error: "Name and password required" }, { status: 400 })
    }

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    await session.withTransaction(async () => {

      // 🔍 Check existing user
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
      }).session(session)

      if (existingUser) {
        throw new Error("User already exists")
      }

      // 🔐 Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // 🔥 CREATE USER
      const user = await User.create(
        [{
          name,
          email,
          phone,
          password: hashedPassword,
          role: "customer"
        }],
        { session }
      )

      let referredById: mongoose.Types.ObjectId | undefined
      let retailerId: mongoose.Types.ObjectId

      // ================= REFERRAL =================
      if (referralCode) {
        const parent = await Customer.findOne({ referralCode }).session(session)

        if (!parent) {
          throw new Error("Invalid referral code")
        }

        referredById = parent._id
        retailerId = parent.retailerId // 🔥 inherit retailer
      }

      // ================= DIRECT JOIN =================
      else {
        if (!inputRetailerId) {
          throw new Error("Retailer ID required")
        }

        const retailer = await User.findOne({
          _id: inputRetailerId,
          role: "retailer"
        }).session(session)

        if (!retailer) {
          throw new Error("Invalid retailer")
        }

        retailerId = retailer._id
      }

      // 🔁 Generate unique referral code
      let newReferralCode = generateReferralCode(name)

      let exists = await Customer.findOne({ referralCode: newReferralCode }).session(session)

      while (exists) {
        newReferralCode = generateReferralCode(name)
        exists = await Customer.findOne({ referralCode: newReferralCode }).session(session)
      }

      // 🔥 CREATE CUSTOMER
      await Customer.create(
        [{
          userId: user[0]._id,
          retailerId,
          referralCode: newReferralCode,
          ...(referredById && { referredBy: referredById }),
          walletBalance: 0
        }],
        { session }
      )

    })

    return NextResponse.json(
      {
        message: "Customer registered successfully"
      },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("REGISTER ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  } finally {
    session.endSession()
  }
}