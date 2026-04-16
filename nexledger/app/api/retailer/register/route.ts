import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import bcrypt from "bcryptjs"

// 🔧 Generate retailer referral code
function generateRetailerCode(name: string) {
  const prefix = name.replace(/\s+/g, "").substring(0, 3).toUpperCase()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${random}`
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    let { name, email, phone, password } = await req.json()

    // 🔥 Normalize
    name = name?.trim()
    email = email?.toLowerCase().trim()
    phone = phone?.trim()

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

    // ================= SAFE QUERY =================

    const query: any[] = []
    if (email) query.push({ email })
    if (phone) query.push({ phone })

    if (query.length > 0) {
      const existingUser = await User.findOne({ $or: query })

      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        )
      }
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 🔁 Generate UNIQUE referral code
    let referralCode = generateRetailerCode(name)

    let exists = await User.findOne({ referralCode })

    while (exists) {
      referralCode = generateRetailerCode(name)
      exists = await User.findOne({ referralCode })
    }

    // Create RETAILER
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "retailer",
      referralCode 
    })

    return NextResponse.json(
      {
        message: "Retailer registered successfully",
        userId: user._id,
        referralCode: user.referralCode // VERY IMPORTANT
      },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("RETAILER REGISTER ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}