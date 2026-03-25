import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect()

  const { id } = await params

  const invoice = await SalesInvoice.findById(id)

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(invoice)
}