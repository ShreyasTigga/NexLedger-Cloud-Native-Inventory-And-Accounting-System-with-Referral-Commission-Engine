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
    const res = await fetch("/api/retailer/dashboard")
    const data = await res.json()
    setDashboard(data)
  }

  // ================= FETCH INVENTORY =================
  async function fetchItems() {
    const res = await fetch(`/api/inventory/items?page=${page}`)
    const data = await res.json()

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

  // ================= REVENUE DATA (FROM SALES) =================
  const revenueMap: Record<string, number> = {}

  dashboard.recentSales?.forEach((sale) => {
    const date = new Date(sale.createdAt).toLocaleDateString()

    if (!revenueMap[date]) {
      revenueMap[date] = 0
    }

    revenueMap[date] += sale.totalAmount
  })

  const revenueData = Object.entries(revenueMap).map(
    ([date, revenue]) => ({
      date,
      revenue
    })
  )

  // ================= INVENTORY CHART =================
  const inventoryChart = items.map((item) => ({
    name: item.name,
    stock: item.stockQuantity
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* ================= TITLE ================= */}
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
            {dashboard.lowStockItems.length}
          </p>
        </div>

      </div>

      {/* ================= LOW STOCK ALERT ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-3">
          Low Stock Alerts
        </h2>

        {dashboard.lowStockItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            All products are sufficiently stocked ✅
          </p>
        ) : (
          dashboard.lowStockItems.map((item) => (
            <div
              key={item._id}
              className="flex justify-between text-sm py-1"
            >
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
          <p className="text-sm text-gray-500">
            No sales data available
          </p>
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

      {/* ================= INVENTORY CHART ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          Inventory Distribution
        </h2>

        {inventoryChart.length === 0 ? (
          <p className="text-sm text-gray-500">
            No inventory data
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryChart}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ================= INVENTORY TABLE ================= */}
      <div className="bg-white p-6 rounded-xl shadow-md">

        <h2 className="text-lg font-semibold mb-4">
          Inventory Overview
        </h2>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 uppercase text-xs">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Cost</th>
              <th className="p-3 text-left">Selling</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Value</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const inventoryValue =
                item.stockQuantity * item.costPrice

              let status = "Normal"
              let color = "text-green-600"

              if (item.stockQuantity === 0) {
                status = "Out of Stock"
                color = "text-red-600"
              } else if (
                item.stockQuantity <= item.reorderLevel
              ) {
                status = "Low Stock"
                color = "text-yellow-600"
              }

              return (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.sku}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">₹{item.costPrice}</td>
                  <td className="p-3">₹{item.sellingPrice}</td>
                  <td className="p-3">{item.stockQuantity}</td>

                  <td className="p-3 font-semibold">
                    ₹{inventoryValue}
                  </td>

                  <td className={`p-3 ${color}`}>
                    {status}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center gap-4">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  )
}