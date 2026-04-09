import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SalesInvoice from "@/models/salesInvoice"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    if (!user || user.role !== "retailer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const retailerId = user.userId

    const stats = await SalesInvoice.aggregate([
      {
        $match: { retailerId }
      },
      {
        $facet: {

          // 💰 Total Revenue
          revenue: [
            {
              $group: {
                _id: null,
                total: { $sum: "$totalAmount" }
              }
            }
          ],

          // 📦 Total Sales Count
          salesCount: [
            {
              $count: "count"
            }
          ],

          // 🧾 GST Calculation
          gst: [
            { $unwind: "$items" },
            {
              $group: {
                _id: null,
                totalCGST: {
                  $sum: { $divide: ["$items.gstAmount", 2] }
                },
                totalSGST: {
                  $sum: { $divide: ["$items.gstAmount", 2] }
                }
              }
            }
          ],

          // 🕒 Recent Invoices (OPTIMIZED)
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                totalAmount: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ])

    const result = stats?.[0] || {}

    return NextResponse.json({
      totalRevenue: result.revenue?.[0]?.total || 0,
      totalSales: result.salesCount?.[0]?.count || 0,
      totalCGST: result.gst?.[0]?.totalCGST || 0,
      totalSGST: result.gst?.[0]?.totalSGST || 0,
      recentInvoices: result.recent || []
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}