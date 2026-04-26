import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import Retailer from "@/models/retailer"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

// 🔧 Generate referral code
function generateRetailerCode(name: string) {
  const prefix = name.replace(/\s+/g, "").substring(0, 3).toUpperCase()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${random}`
}

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    // ================= GET BODY =================
    let {
      businessName,
      ownerName,
      email,
      phone,
      password,
      gstin,
      pan,
      address
    } = await req.json()

    // ================= NORMALIZE =================
    businessName = businessName?.trim()
    ownerName = ownerName?.trim()
    email = email?.toLowerCase().trim()
    phone = phone?.trim()
    gstin = gstin?.toUpperCase().trim()
    pan = pan?.toUpperCase().trim()

    // ================= VALIDATION =================
    if (!businessName || !ownerName || !password) {
      return NextResponse.json(
        { error: "Business name, owner name and password required" },
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

    if (!address?.line1 || !address?.city || !address?.state || !address?.pincode) {
      return NextResponse.json(
        { error: "Complete address is required" },
        { status: 400 }
      )
    }

    // ================= CHECK EXISTING =================
    const query: any[] = []
    if (email) query.push({ email })
    if (phone) query.push({ phone })

    if (query.length > 0) {
      const existingUser = await User.findOne({ $or: query }).lean()

      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        )
      }
    }

    // ================= HASH PASSWORD =================
    const hashedPassword = await bcrypt.hash(password, 10)

    // ================= GENERATE REFERRAL =================
    let referralCode = ""
    let exists = null

    do {
      referralCode = generateRetailerCode(businessName)
      exists = await User.findOne({ referralCode }).lean()
    } while (exists)

    let createdUser: any = null

await session.withTransaction(async () => {
  const user = await User.create(
    [{
      name: ownerName,
      email,
      phone,
      password: hashedPassword,
      role: "retailer",
      referralCode
    }],
    { session }
  )

  createdUser = user[0]

  await Retailer.create(
    [{
      userId: createdUser._id,
      businessName,
      ownerName,
      email,
      phone,
      gstin,
      pan,
      address: {
        line1: address.line1,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: "India"
      }
    }],
    { session }
  )
})

if (!createdUser) {
  return NextResponse.json(
    { error: "User creation failed" },
    { status: 500 }
  )
}

    // ================= RESPONSE =================
    return NextResponse.json(
      {
        message: "Retailer registered successfully",
        userId: createdUser?._id,
        referralCode
      },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("RETAILER REGISTER ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )

  } finally {
    session.endSession()
  }
}