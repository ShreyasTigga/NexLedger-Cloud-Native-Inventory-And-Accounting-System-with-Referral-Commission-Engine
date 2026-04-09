import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"
import SalesInvoice from "@/models/salesInvoice"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔴 Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      )
    }

    let query: any = {
      _id: params.id
    }

    // 🧠 RETAILER FLOW
    if (user.role === "retailer") {
      query.retailerId = user.userId
    }

    // 🧠 CUSTOMER FLOW
    else if (user.role === "customer") {
      query.customerId = user.customerId
    }

    else {
      return NextResponse.json(
        { error: "Invalid role" },
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

    return NextResponse.json(invoice)

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}