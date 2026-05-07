"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import {
  AlertTriangle,
  BadgeIndianRupee,
  Boxes,
  ChartNoAxesCombined,
  IndianRupee,
  ReceiptText
} from "lucide-react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

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

export default function DashboardPage() {

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

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
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading dashboard...
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load dashboard
      </div>
    )
  }

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

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(dashboard.totalRevenue),
      hint: "Sales value",
      color: "text-emerald-600",
      icon: IndianRupee
    },
    {
      label: "Total Expense",
      value: formatCurrency(dashboard.totalExpense),
      hint: "Purchase and operating cost",
      color: "text-rose-600",
      icon: ReceiptText
    },
    {
      label: "Net Profit",
      value: formatCurrency(profit),
      hint: `${profitPercentage}% margin`,
      color: profit >= 0 ? "text-emerald-600" : "text-rose-600",
      icon: ChartNoAxesCombined
    },
    {
      label: "Low Stock",
      value: String(dashboard.lowStockItems?.length ?? 0),
      hint: "Items need attention",
      color: "text-amber-600",
      icon: AlertTriangle
    }
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Business overview</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Retailer Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              A quick view of revenue, stock alerts, profit, and recent sales activity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <BadgeIndianRupee size={18} className="text-blue-600" />
            INR reporting
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className={`mt-2 text-2xl font-semibold ${card.color}`}>
                    {card.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{card.hint}</p>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Low Stock Alerts</h2>
              <p className="mt-1 text-sm text-slate-500">Products below reorder level.</p>
            </div>
            <Boxes size={20} className="text-blue-600" />
          </div>

          {(dashboard.lowStockItems?.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              All products are sufficiently stocked
            </div>
          ) : (
            <div className="space-y-2">
              {dashboard.lowStockItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600">
                    {item.stockQuantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Top Selling Products</h2>
          <p className="mt-1 text-sm text-slate-500">Best performers from recent sales.</p>

          {!dashboard.topProducts || dashboard.topProducts.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No product data available
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {dashboard.topProducts.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {item.totalSold} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Revenue Trend</h2>

          {revenueData.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No sales data available
            </div>
          ) : (
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Profit Trend</h2>

          {profitData.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No data available
            </div>
          ) : (
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
