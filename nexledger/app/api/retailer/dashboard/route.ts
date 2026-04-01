import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"

import SalesInvoice from "@/models/salesInvoice"
import Item from "@/models/item"

export async function GET() {
  try {
    await dbConnect()

    // ================= TOTAL REVENUE =================
    const revenueData = await SalesInvoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ])

    const totalRevenue = revenueData[0]?.totalRevenue || 0

    // ================= TOTAL SALES =================
    const totalSales = await SalesInvoice.countDocuments()

    // ================= LOW STOCK =================
    const lowStockItems = await Item.find({
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] }
    })
      .select("name stockQuantity reorderLevel")
      .limit(5)

    // ================= RECENT SALES =================
    const recentSales = await SalesInvoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("totalAmount createdAt")

    // ================= TOP PRODUCTS =================
    const topProducts = await SalesInvoice.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ])

    return NextResponse.json({
      totalRevenue,
      totalSales,
      lowStockItems,
      recentSales,
      topProducts
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}