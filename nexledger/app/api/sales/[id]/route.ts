import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import SalesInvoice from "@/models/salesInvoice"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const { id } = await params

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔐 ID VALIDATION
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      )
    }

    let query: any = {
      _id: id
    }

    // 🧠 RETAILER FLOW
    if (user.role === "retailer") {
      if (!user.userId) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }

      query.retailerId = user.userId
    }

    // 🧠 CUSTOMER FLOW
    else if (user.role === "customer") {
      if (!user.customerId) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }

      query.customerId = user.customerId
    }

    else {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const invoice = await SalesInvoice.findOne(query).lean()

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found or unauthorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      invoice
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}