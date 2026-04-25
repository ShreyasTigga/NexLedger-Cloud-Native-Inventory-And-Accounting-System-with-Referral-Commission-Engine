"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

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
  totalExpense: number
  totalCOGS: number
  lowStockItems: Item[]
  recentSales?: Sale[]
  topProducts?: { name: string; totalSold: number }[]
}

// ================= COMPONENT =================

export default function DashboardPage() {

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // ================= CALCULATIONS =================

  const profit =
    (dashboard?.totalRevenue || 0) -
    (dashboard?.totalCOGS || 0)

  const profitPercentage =
    dashboard?.totalRevenue
      ? ((profit / dashboard.totalRevenue) * 100).toFixed(2)
      : "0"

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount)

  // ================= FETCH =================

  async function fetchDashboard() {
    const data = await apiFetch("/api/retailer/dashboard")
    if (!data) {
      console.error("Dashboard fetch failed")
      return
    }
    setDashboard(data)
  }

  async function fetchItems() {
    const data = await apiFetch(`/api/inventory/items?page=${page}`)
    if (!data) return

    setItems(data.products || [])
    setTotalPages(data.totalPages || 1)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      await fetchDashboard()
      await fetchItems()
      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [page])

  if (loading) {
    return <p className="p-6">Loading dashboard...</p>
  }

  if (!dashboard) {
    return <p className="p-6 text-red-500">Failed to load dashboard</p>
  }

  // ================= CHART DATA =================

  const revenueMap: Record<string, number> = {}

  dashboard?.recentSales?.forEach((sale) => {
    const date = new Date(sale.createdAt).toLocaleDateString()
    revenueMap[date] = (revenueMap[date] || 0) + sale.totalAmount
  })

  const revenueData = Object.entries(revenueMap).map(
    ([date, revenue]) => ({ date, revenue })
  )

  const avgExpensePerDay =
    (dashboard?.totalExpense || 0) /
    (Object.keys(revenueMap).length || 1)

  const profitData = Object.entries(revenueMap).map(([date, revenue]) => ({
    date,
    profit: revenue - avgExpensePerDay
  }))

  // ================= UI =================

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      <div>
        <h1 className="text-2xl font-semibold">Retailer Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview of your business performance
        </p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(dashboard.totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Expense</p>
          <p className="text-2xl font-bold text-red-500">
            {formatCurrency(dashboard.totalExpense)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold ${
            profit >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            {formatCurrency(profit)}
          </p>
          <p className="text-sm text-gray-500">
            {profitPercentage}% margin
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-500">
            {dashboard.lowStockItems?.length ?? 0}
          </p>
        </div>

      </div>

      {/* ================= LOW STOCK ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Low Stock Alerts</h2>

        {(dashboard.lowStockItems?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            📦 All products are sufficiently stocked
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

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Revenue */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Revenue Trend</h2>

          {revenueData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              📊 No sales data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profit */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Profit Trend</h2>

          {profitData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              📊 No data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#16a34a"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ================= TOP PRODUCTS ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Top Selling Products</h2>

        {!dashboard.topProducts || dashboard.topProducts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            📦 No product data available
          </p>
        ) : (
          dashboard.topProducts.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b text-sm">
              <span>{item.name}</span>
              <span className="font-medium">{item.totalSold}</span>
            </div>
          ))
        )}
      </div>

    </div>
  )
}