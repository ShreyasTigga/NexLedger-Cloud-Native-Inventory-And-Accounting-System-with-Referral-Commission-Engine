import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken
} from "@/lib/jwt"
import User from "@/models/user"
import Customer from "@/models/customer"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // 🔐 GET REFRESH TOKEN FROM COOKIE (UPDATED)
    const refreshToken = req.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No token" },
        { status: 401 }
      )
    }

    // ================= VERIFY =================
    const decoded: any = verifyRefreshToken(refreshToken)

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const user = await User.findById(decoded.userId)

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    // ================= EXTRA PAYLOAD =================
    let extraPayload: any = {}

    if (user.role === "customer") {
      const customer = await Customer.findOne(
        { userId: user._id },
        { _id: 1, retailerId: 1 }
      ).lean()

      if (customer) {
        extraPayload = {
          customerId: customer._id,
          retailerId: customer.retailerId
        }
      }
    }

    // ================= NEW TOKENS =================
    const newAccessToken = signAccessToken({
      userId: user._id,
      role: user.role,
      ...extraPayload
    })

    // 🔥 ROTATE refresh token
    const newRefreshToken = signRefreshToken({
      userId: user._id
    })

    user.refreshToken = newRefreshToken
    await user.save()

    const res = NextResponse.json({
      message: "Token refreshed"
    })

    // ================= SET NEW COOKIES =================

    res.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15 // 15 min
    })

    res.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return res

  } catch (err) {
    console.log("REFRESH ERROR:", err)

    return NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 }
    )
  }
}