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

    // 🔥 Normalize inputs
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    if (!referralCode && !inputRetailerId) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      )
    }

    // ================= TRANSACTION =================

    await session.withTransaction(async () => {

      // 🔍 Safe query (avoid empty $or)
      const query: any[] = []
      if (email) query.push({ email })
      if (phone) query.push({ phone })

      let existingUser = null

      if (query.length > 0) {
        existingUser = await User.findOne({ $or: query }).session(session)
      }

      if (existingUser) {
        throw new Error("User already exists")
      }

      // 🔐 Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // 🔥 Create User
      const user = await User.create(
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

      let retailerId: mongoose.Types.ObjectId
      let referredById: mongoose.Types.ObjectId | undefined

      // ================= REFERRAL FLOW =================
if (referralCode) {

  // 🔍 Try finding customer first
  const parentCustomer = await Customer.findOne({ referralCode }).session(session)

  if (parentCustomer) {
    retailerId = parentCustomer.retailerId
    referredById = parentCustomer._id
  }

  else {
    // 🔍 Try finding retailer
    const parentRetailer = await User.findOne({
      referralCode,
      role: "retailer"
    }).session(session)

    if (!parentRetailer) {
      throw new Error("Invalid referral code")
    }

    retailerId = parentRetailer._id
    //  No referredBy → top-level customer
  }
}

      // ================= DIRECT JOIN =================
      else {
        const retailer = await User.findOne({
          _id: inputRetailerId,
          role: "retailer"
        }).session(session)

        if (!retailer) {
          throw new Error("Invalid retailer")
        }

        retailerId = retailer._id
      }

      // 🔁 Generate UNIQUE referral code
      let newReferralCode = generateReferralCode(name)

      let exists = await Customer.findOne({
        referralCode: newReferralCode
      }).session(session)

      while (exists) {
        newReferralCode = generateReferralCode(name)
        exists = await Customer.findOne({
          referralCode: newReferralCode
        }).session(session)
      }

      // 🔥 Create Customer
      await Customer.create(
        [
          {
            userId: user[0]._id,
            retailerId,
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