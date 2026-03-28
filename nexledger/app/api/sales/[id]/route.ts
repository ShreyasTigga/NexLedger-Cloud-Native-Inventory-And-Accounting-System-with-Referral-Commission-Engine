import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect()

  const invoice = await SalesInvoice.findById(params.id)

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(invoice)
}