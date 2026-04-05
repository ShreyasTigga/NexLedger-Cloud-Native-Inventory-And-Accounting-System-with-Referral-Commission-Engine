import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/customer"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { identifier, password } = await req.json()

    const user = await Customer.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

const token = signToken({
  userId: user._id,
  role: user.role
})

    const response = NextResponse.json({
      message: "Login successful"
    })

    // 🔥 STORE IN COOKIE
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false, // change to true in production
      path: "/"
    })

    return response

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}