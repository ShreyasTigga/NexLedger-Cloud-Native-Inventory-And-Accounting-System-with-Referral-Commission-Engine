import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    let user: any = null

    // Try to get user (optional cleanup)
    try {
      user = getUserFromRequest(req)
    } catch {}

    if (user) {
      await User.findByIdAndUpdate(user.userId, {
        $unset: { refreshToken: "" }
      })
    }

    const res = NextResponse.json({ message: "Logged out" })

    // ❌ Clear access token
    res.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/"
    })

    // ❌ Clear refresh token
    res.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/"
    })

    return res

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Logout failed" },
      { status: 500 }
    )
  }
}