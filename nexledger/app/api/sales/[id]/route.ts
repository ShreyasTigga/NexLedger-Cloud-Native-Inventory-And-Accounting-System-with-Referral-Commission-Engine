import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // AUTH CHECK
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // MULTI-TENANT SAFE QUERY
    const invoice = await SalesInvoice.findOne({
      _id: params.id,
      retailerId: user.userId
    })

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