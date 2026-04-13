import { NextRequest, NextResponse } from "next/server"
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    const decoded: any = verifyRefreshToken(refreshToken)

    const user = await User.findById(decoded.userId)

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const newAccessToken = signAccessToken({
      userId: user._id,
      role: user.role
    })

    const res = NextResponse.json({ message: "Token refreshed" })

    res.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      path: "/"
    })

    return res

  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
  }
}