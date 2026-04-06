import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { identifier, password } = await req.json()

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

    // 🔐 Check password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // 🔥 Create JWT
    const token = signToken({
      userId: user._id,
      role: user.role
    })

    const res = NextResponse.json({
      message: "Login successful",
      role: user.role
    })

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      path: "/"
    })

    return res

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}