import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"

export async function GET() {
  await dbConnect()

  const revenueData = await SalesInvoice.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" }
      }
    }
  ])

  const totalSales = await SalesInvoice.countDocuments()

  const invoices = await SalesInvoice.find()

  let totalCGST = 0
  let totalSGST = 0

  invoices.forEach(inv => {
    inv.items.forEach((item: any) => {
      totalCGST += item.gstAmount / 2
      totalSGST += item.gstAmount / 2
    })
  })

  const recentInvoices = await SalesInvoice.find()
    .sort({ createdAt: -1 })
    .limit(5)

  return NextResponse.json({
    totalRevenue: revenueData[0]?.total || 0,
    totalSales,
    totalCGST,
    totalSGST,
    recentInvoices
  })
}