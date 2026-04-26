import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import Customer from "@/models/customer"
import bcrypt from "bcryptjs"
import mongoose, { ClientSession } from "mongoose"

// 🔧 Generate referral code
function generateReferralCode(name: string) {
  const prefix = name.replace(/\s+/g, "").substring(0, 3).toUpperCase()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${random}`
}

export async function POST(req: NextRequest) {
  let session: ClientSession | null = null

  try {
    await dbConnect()

    session = await mongoose.startSession()

    const body = await req.json()

    let {
      name,
      email,
      phone,
      password,
      referralCode,
      retailerId: inputRetailerId
    } = body

    // ================= NORMALIZE =================
    name = name?.trim()
    email = email?.toLowerCase().trim()
    phone = phone?.trim()
    referralCode = referralCode?.trim()

    // ================= VALIDATION =================

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

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    if (!referralCode && !inputRetailerId) {
      return NextResponse.json(
        { error: "Referral code or retailer required" },
        { status: 400 }
      )
    }

    // ================= TRANSACTION =================

    await session.withTransaction(async () => {

      // ================= CHECK EXISTING =================
      const query: any[] = []
      if (email) query.push({ email })
      if (phone) query.push({ phone })

      if (query.length > 0) {
        const existingUser = await User.findOne({ $or: query }).session(session)
        if (existingUser) {
  return NextResponse.json(
    { error: "User already exists" },
    { status: 400 }
  )
}
      }

      // ================= HASH PASSWORD =================
      const hashedPassword = await bcrypt.hash(password, 10)

      // ================= CREATE USER =================
      const userArr = await User.create(
      [
        {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "customer"
        }
      ],
      { session }
      )

const user = userArr[0]

      let retailerId: mongoose.Types.ObjectId
      let referredById: mongoose.Types.ObjectId | undefined

      // ================= REFERRAL FLOW =================
      if (referralCode) {

        // 🔍 Try customer first
        let parentCustomer = await Customer.findOne({ referralCode }).session(session)

        if (parentCustomer) {
          retailerId = parentCustomer.retailerId

          // 🔁 re-check within retailer scope (multi-tenant safety)
          parentCustomer = await Customer.findOne({
            referralCode,
            retailerId
          }).session(session)

          if (!parentCustomer) {
            return NextResponse.json(
  { error: "Invalid referral code" },
  { status: 400 }
)
          }

          referredById = parentCustomer._id
        }

        else {
          // 🔍 Try retailer
          const parentRetailer = await User.findOne({
            referralCode,
            role: "retailer"
          }).session(session)

          if (!parentRetailer) {
            return NextResponse.json(
  { error: "Invalid referral code" },
  { status: 400 }
)
          }

          retailerId = parentRetailer._id
        }
      }

      // ================= DIRECT JOIN =================
      else {
        const retailer = await User.findOne({
          _id: inputRetailerId,
          role: "retailer"
        }).session(session)

        if (!retailer) {
          return NextResponse.json(
  { error: "Invalid retailer" },
  { status: 400 }
)
        }

        retailerId = retailer._id
      }

      // ================= GENERATE UNIQUE REFERRAL CODE =================
      let newReferralCode = ""
      let exists = null
      let attempts = 0

      do {
        newReferralCode = generateReferralCode(name)
        exists = await Customer.findOne({
          referralCode: newReferralCode,
          retailerId
        }).session(session)

        attempts++
      } while (exists && attempts < 5)

      if (attempts === 5) {
        return NextResponse.json(
  { error: "Failed to generate referral code" },
  { status: 400 }
)
      }

      // ================= CREATE CUSTOMER =================
      await Customer.create(
        [
          {
            userId: user._id,
            retailerId,
            name,
            phone,
            email,
            referralCode: newReferralCode,
            ...(referredById && { referredBy: referredById }),
            walletBalance: 0
          }
        ],
        { session }
      )

    })

    return NextResponse.json(
      { message: "Customer registered successfully" },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("REGISTER ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )

  } finally {
    if (session) session.endSession()
  }
}