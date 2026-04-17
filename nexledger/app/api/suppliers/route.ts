import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Supplier from "@/models/supplier"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

// ================= CREATE =================
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const name = body.name?.trim()
    const phone = body.phone?.trim()
    const email = body.email?.trim()

    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }

    const supplier = await Supplier.create({
      retailerId: user.userId,
      name,
      phone,
      email
    })

    return NextResponse.json(supplier, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const suppliers = await Supplier.find({
      retailerId: user.userId
    }).sort({ createdAt: -1 })

    return NextResponse.json({ suppliers })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}