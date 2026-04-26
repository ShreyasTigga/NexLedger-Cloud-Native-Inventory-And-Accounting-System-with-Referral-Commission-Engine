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

    // FIND USER (optimized)
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
      const customer = await Customer.findOne(
        { userId: user._id },
        { _id: 1, retailerId: 1 }
      ).lean()

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

    // OPTIONAL: store refresh token in DB
    user.refreshToken = refreshToken
    await user.save()

    const res = NextResponse.json({
      message: "Login successful",
      role: user.role,
      accessToken,     // ✅ ADDED
      refreshToken     // ✅ ADDED
    })

    // ================= COOKIES =================

    const isRetailer = user.role === "retailer"

    const accessTokenName = isRetailer
      ? "retailerToken"
      : "customerToken"

    const refreshTokenName = isRetailer
      ? "retailerRefreshToken"
      : "customerRefreshToken"

    // 🔥 CLEAR OTHER ROLE COOKIE
    res.cookies.set("retailerToken", "", {
      expires: new Date(0),
      path: "/"
    })

    res.cookies.set("customerToken", "", {
      expires: new Date(0),
      path: "/"
    })

    res.cookies.set("retailerRefreshToken", "", {
      expires: new Date(0),
      path: "/"
    })

    res.cookies.set("customerRefreshToken", "", {
      expires: new Date(0),
      path: "/"
    })

    // 🔐 ACCESS TOKEN
    res.cookies.set(accessTokenName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    })

    // 🔐 REFRESH TOKEN
    res.cookies.set(refreshTokenName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
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