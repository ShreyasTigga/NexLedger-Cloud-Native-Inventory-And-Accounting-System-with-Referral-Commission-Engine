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

    const authHeader = req.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token" },
        { status: 401 }
      )
    }

    const refreshToken = authHeader.split(" ")[1]

    // ================= VERIFY =================
    const decoded: any = verifyRefreshToken(refreshToken)

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
      const customer = await Customer.findOne({
        userId: user._id
      })

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

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })

  } catch (err) {
    console.log("REFRESH ERROR:", err)

    return NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 }
    )
  }
}