import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"

import SalesInvoice from "@/models/salesInvoice"
import Item from "@/models/item"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = getUserFromRequest(req)

    // 🔐 AUTH CHECK
    if (!user || user.role !== "retailer") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const retailerId = user.userId

    // ================= TOTAL REVENUE =================
    const revenueData = await SalesInvoice.aggregate([
      {
        $match: { retailerId } // 🔥 FIX
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ])

    const totalRevenue = revenueData[0]?.totalRevenue || 0

    // ================= TOTAL SALES =================
    const totalSales = await SalesInvoice.countDocuments({
      retailerId // 🔥 FIX
    })

    // ================= LOW STOCK =================
    const lowStockItems = await Item.find({
      retailerId, // 🔥 FIX
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] }
    })
      .select("name stockQuantity reorderLevel")
      .limit(5)
      .lean()

    // ================= RECENT SALES =================
    const recentSales = await SalesInvoice.find({
      retailerId // 🔥 FIX
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("totalAmount createdAt")
      .lean()

    // ================= TOP PRODUCTS =================
    const topProducts = await SalesInvoice.aggregate([
      {
        $match: { retailerId } // 🔥 FIX
      },
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
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}