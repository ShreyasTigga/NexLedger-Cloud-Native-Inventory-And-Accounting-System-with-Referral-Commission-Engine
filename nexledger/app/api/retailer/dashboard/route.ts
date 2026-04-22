import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import SalesInvoice from "@/models/salesInvoice"
import Item from "@/models/item"
import { getUserFromRequest } from "@/lib/getUserFromRequest"
import PurchaseInvoice from "@/models/purchaseInvoice"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    let user

    // 🔐 SAFE AUTH
    try {
      user = await getUserFromRequest(req)
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

    const retailerId = new mongoose.Types.ObjectId(user.userId)

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
  { $limit: 5 },

  // ✅ ADD THIS
  {
    $project: {
      _id: 0,
      name: "$_id",
      totalSold: 1
    }
  }
])

    // ================= PURCHASE TOTAL =================
const purchaseAgg = await PurchaseInvoice.aggregate([
  {
    $match: {retailerId}
  },
  {
    $group: {
      _id: null,
      totalExpense: { $sum: "$totalAmount" }
    }
  }
])

const totalExpense = purchaseAgg[0]?.totalExpense || 0

// ================= COGS (REAL EXPENSE) =================
const cogsAgg = await SalesInvoice.aggregate([
  { $match: { retailerId } },
  { $unwind: "$items" },
  {
    $group: {
      _id: null,
      totalCOGS: {
        $sum: {
          $multiply: [
            { $ifNull: ["$items.costPrice", 0] }, 
            "$items.quantity"
          ]
        }
      }
    }
  }
])

const totalCOGS = cogsAgg[0]?.totalCOGS || 0

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalSales,
        totalExpense,
        totalCOGS,
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