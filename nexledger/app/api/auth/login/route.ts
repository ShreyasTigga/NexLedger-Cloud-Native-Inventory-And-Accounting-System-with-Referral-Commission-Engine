import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import Customer from "@/models/customer"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const identifier = body.identifier?.trim()
    const password = body.password

    // VALIDATION
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      )
    }

    // FIND USER
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // CHECK PASSWORD
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

    // ================= TOKENS =================

    const accessToken = signAccessToken({
      userId: user._id,
      role: user.role,
      ...extraPayload
    })

    const refreshToken = signRefreshToken({
      userId: user._id
    })

    // OPTIONAL: store refresh token in DB (recommended)
    user.refreshToken = refreshToken
    await user.save()

    const res = NextResponse.json({
      message: "Login successful",
      role: user.role
    })

    // ================= COOKIES =================

    // 🔐 Access Token (short-lived)
    const tokenName =
      user.role === "retailer"
      ? "retailerToken"
      : "customerToken"

    res.cookies.set(tokenName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    })

    // 🔐 Refresh Token (long-lived)
    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
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