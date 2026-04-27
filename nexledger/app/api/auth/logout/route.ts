import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    let user: any = null

    // 🔐 SAFE USER EXTRACTION
    try {
      user = await getUserFromRequest(req)
    } catch {}

    // 🔐 CLEAR REFRESH TOKEN IN DB (if valid user)
    if (user?.userId) {
      await User.findByIdAndUpdate(user.userId, {
        $unset: { refreshToken: "" }
      })
    }

    const res = NextResponse.json({
      message: "Logged out"
    })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      expires: new Date(0)
    }

    // 🔥 CLEAR AUTH COOKIES (SIMPLIFIED)
    res.cookies.set("accessToken", "", cookieOptions)
    res.cookies.set("refreshToken", "", cookieOptions)

    return res

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Logout failed" },
      { status: 500 }
    )
  }
}