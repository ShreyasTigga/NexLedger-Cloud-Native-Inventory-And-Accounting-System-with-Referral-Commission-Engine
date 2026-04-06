import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { name, email, phone, password } = await req.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password required" },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone required" },
        { status: 400 }
      )
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // 🔥 Create USER (retailer)
    await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "retailer"
    })

    return NextResponse.json(
      {
        message: "Retailer registered successfully"
      },
      { status: 201 }
    )

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}