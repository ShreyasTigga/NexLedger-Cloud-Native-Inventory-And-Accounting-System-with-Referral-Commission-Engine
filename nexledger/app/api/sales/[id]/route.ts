import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import SalesInvoice from "@/models/salesInvoice"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    // ✅ ALWAYS extract like this
    const { id } = await params

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // ✅ FIXED: use id (NOT params.id)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      )
    }

    let query: any = {
      _id: id // ✅ FIXED
    }

    // 🧠 RETAILER FLOW
    if (user.role === "retailer") {
      query.retailerId = user.userId
    }

    // 🧠 CUSTOMER FLOW
    else if (user.role === "customer") {

      const customer = await Customer.findOne({
        userId: user.userId
      })

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        )
      }

      query.customerId = customer._id
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