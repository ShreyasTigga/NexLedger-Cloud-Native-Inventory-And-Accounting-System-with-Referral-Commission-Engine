import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"

import SalesInvoice from "@/models/salesInvoice"
import Item from "@/models/item"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    let user

    // 🔐 SAFE AUTH
    try {
      user = getUserFromRequest(req)
    } catch {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!user || user.role !== "retailer") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const retailerId = user.userId

    // ================= DATA =================

    const revenueData = await SalesInvoice.aggregate([
      { $match: { retailerId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ])

    const totalRevenue = revenueData[0]?.totalRevenue || 0

    const totalSales = await SalesInvoice.countDocuments({ retailerId })

    const lowStockItems = await Item.find({
      retailerId,
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] }
    })
      .select("name stockQuantity reorderLevel")
      .limit(5)
      .lean()

    const recentSales = await SalesInvoice.find({ retailerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("totalAmount createdAt")
      .lean()

    const topProducts = await SalesInvoice.aggregate([
      { $match: { retailerId } },
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
      success: true,
      data: {
        totalRevenue,
        totalSales,
        lowStockItems,
        recentSales,
        topProducts
      }
    })

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    )
  }
}