"use client"

import { useEffect, useState } from "react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"

// ================= API FETCH WRAPPER =================
async function apiFetch(url: string) {
  const res = await fetch(url, {
    credentials: "include"
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = "/retailer/login"
      return null
    }

    const err = await res.json()
    alert(err.error || "Something went wrong")
    return null
  }

  const data = await res.json()
  return data.data 
}

// ================= TYPES =================

interface Item {
  _id: string
  name: string
  sku: string
  category: string
  costPrice: number
  sellingPrice: number
  stockQuantity: number
  reorderLevel: number
}

interface Sale {
  _id: string
  totalAmount: number
  createdAt: string
}

interface DashboardData {
  totalRevenue: number
  totalSales: number
  lowStockItems: Item[]
  recentSales?: Sale[]
}

// ================= COMPONENT =================

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // ================= FETCH DASHBOARD =================
  async function fetchDashboard() {
    const data = await apiFetch("/api/retailer/dashboard")
    if (!data) return

    setDashboard(data)
  }

  // ================= FETCH INVENTORY =================
  async function fetchItems() {
    const data = await apiFetch(`/api/inventory/items?page=${page}`)
    if (!data) return

    setItems(data.products || [])
    setTotalPages(data.totalPages || 1)
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [page])

  if (!dashboard) return <p className="p-6">Loading dashboard...</p>

  // ================= REVENUE DATA =================
  const revenueMap: Record<string, number> = {}

  dashboard?.recentSales?.forEach((sale) => {
    const date = new Date(sale.createdAt).toLocaleDateString()
    revenueMap[date] = (revenueMap[date] || 0) + sale.totalAmount
  })

  const revenueData = Object.entries(revenueMap).map(
    ([date, revenue]) => ({ date, revenue })
  )

  const inventoryChart = items.map((item) => ({
    name: item.name,
    stock: item.stockQuantity
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      <h1 className="text-2xl font-semibold">
        Retailer Dashboard
      </h1>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{dashboard.totalRevenue}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold">
            {dashboard.totalSales}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-500">
            {dashboard?.lowStockItems?.length ?? 0}
          </p>
        </div>

      </div>

      {/* ================= LOW STOCK ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-3">
          Low Stock Alerts
        </h2>

        {(dashboard?.lowStockItems?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-500">
            All products are sufficiently stocked ✅
          </p>
        ) : (
          dashboard.lowStockItems.map((item) => (
            <div key={item._id} className="flex justify-between text-sm py-1">
              <span>{item.name}</span>
              <span className="text-red-500">
                {item.stockQuantity}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ================= REVENUE CHART ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Revenue Trend</h2>

        {revenueData.length === 0 ? (
          <p className="text-sm text-gray-500">No sales data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}