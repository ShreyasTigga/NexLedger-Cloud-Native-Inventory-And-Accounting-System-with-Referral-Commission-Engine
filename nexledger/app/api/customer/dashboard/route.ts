import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"

export async function GET() {

  await dbConnect()

  const totalOrders = await SalesInvoice.countDocuments()

  const totalSpentAgg = await SalesInvoice.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" }
      }
    }
  ])

  const totalSpent = totalSpentAgg[0]?.total || 0

  return NextResponse.json({
    totalOrders,
    totalSpent,
    referralEarnings: 0,
    walletBalance: 0
  })
}