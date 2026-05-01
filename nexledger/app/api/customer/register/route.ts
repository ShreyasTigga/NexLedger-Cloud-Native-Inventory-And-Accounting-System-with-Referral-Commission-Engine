import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import Customer from "@/models/customer"
import bcrypt from "bcryptjs"
import mongoose, { ClientSession } from "mongoose"
import LedgerEntry from "@/models/ledgerEntry"
import { getUserFromRequest } from "@/lib/getUserFromRequest" // ✅ ADDED

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
      referralCode
    } = body

    // ✅ GET USER FROM TOKEN
    const userFromToken = await getUserFromRequest(req)

    // ================= NORMALIZE =================
    name = name?.trim()
    email = email?.toLowerCase().trim()
    phone = phone?.trim()
    referralCode = referralCode?.trim().toUpperCase()

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

    const retailerUserId = userFromToken?.userId

    // ✅ VALIDATION
    if (!retailerUserId) {
  return NextResponse.json(
    { error: "Only retailer can create customers" },
    { status: 401 }
  )
}

    // ================= TRANSACTION =================

    let createdCustomer: any = null

    await session.withTransaction(async () => {

      // ================= CHECK EXISTING =================
      const query: any[] = []
      if (email) query.push({ email })
      if (phone) query.push({ phone })

      if (query.length > 0) {
        const existingUser = await User.findOne({ $or: query }).session(session)
        if (existingUser) {
          throw new Error("User already exists")
        }
      }

      // ================= HASH PASSWORD =================
      const hashedPassword = await bcrypt.hash(password, 10)

      // ================= CREATE USER =================
      const userArr = await User.create(
        [{
          name,
          email,
          phone,
          password: hashedPassword,
          role: "customer"
        }],
        { session }
      )

      const user = userArr[0]

      let retailerId: mongoose.Types.ObjectId
      let referredById: mongoose.Types.ObjectId | undefined

      // ================= REFERRAL FLOW =================
      const retailer = await User.findOne({
        _id: new mongoose.Types.ObjectId(retailerUserId),
        role: "retailer"
      }).session(session)

      if (!retailer) {
        throw new Error("Invalid retailer")
      }

      retailerId = retailer._id

      // ================= OPTIONAL REFERRAL =================
      if (referralCode) {
        const parentCustomer = await Customer.findOne({
          referralCode,
          retailerId
        }).session(session)

        if (!parentCustomer) {
          throw new Error("Invalid referral code")
        }

        referredById = parentCustomer._id
      }

      // ================= GENERATE REFERRAL =================
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
        throw new Error("Failed to generate referral code")
      }

      // ================= CREATE CUSTOMER =================
      const customerArr = await Customer.create(
        [{
          userId: user._id,
          retailerId,
          name,
          phone,
          email,
          referralCode: newReferralCode,
          ...(referredById && { referredBy: referredById }),
          walletBalance: 0
        }],
        { session }
      )

      const customer = customerArr[0]
      createdCustomer = customer

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