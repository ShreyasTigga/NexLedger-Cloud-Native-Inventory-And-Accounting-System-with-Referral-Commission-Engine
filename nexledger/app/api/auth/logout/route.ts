import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    let user: any = null

    // 🔐 Try to get user (optional cleanup)
    try {
      user = await getUserFromRequest(req)
    } catch {}

    if (user) {
      await User.findByIdAndUpdate(user.userId, {
        $unset: { refreshToken: "" }
      })
    }

    const res = NextResponse.json({ message: "Logged out" })

    // ✅ Clear ALL auth cookies (multi-role safe)
    res.cookies.delete("retailerToken")
    res.cookies.delete("retailerRefreshToken")
    res.cookies.delete("customerToken")
    res.cookies.delete("customerRefreshToken")

    return res

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Logout failed" },
      { status: 500 }
    )
  }
}