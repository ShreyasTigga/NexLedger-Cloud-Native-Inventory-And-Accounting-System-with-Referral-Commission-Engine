import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import Customer from "@/models/customer"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const identifier = body.identifier?.trim()
    const password = body.password

    //  VALIDATION
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      )
    }

    // 🔍 Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    //  Check password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // ================= ROLE CONTEXT =================

    let extraPayload: any = {}

    if (user.role === "customer") {
      const customer = await Customer.findOne({
        userId: user._id
      })

      if (!customer) {
        return NextResponse.json(
          { error: "Customer profile not found" },
          { status: 404 }
        )
      }

      extraPayload = {
        customerId: customer._id,
        retailerId: customer.retailerId
      }
    }

    //  Create JWT (WITH CONTEXT)
    const token = signToken({
      userId: user._id,
      role: user.role,
      ...extraPayload
    })

    const res = NextResponse.json({
      message: "Login successful",
      role: user.role
    })

    //  Secure cookie
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 // 1 day
    })

    return res

  } catch (err: any) {
    console.error("LOGIN ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}