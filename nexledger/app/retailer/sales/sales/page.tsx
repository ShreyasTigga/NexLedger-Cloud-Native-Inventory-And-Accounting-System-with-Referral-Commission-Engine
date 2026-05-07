"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { BadgeIndianRupee, CalendarDays, ReceiptText } from "lucide-react"

interface Invoice {
  _id: string
  totalAmount: number
  createdAt: string
}

interface SalesData {
  totalSales: number
  totalRevenue: number
  invoices: Invoice[]
}

export default function SalesDashboard() {

  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const data = await apiFetch("/api/sales")

        if (!data) {
          setError("Failed to fetch sales data")
          return
        }

        setData(data.data || data)

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading sales data...</div>

  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>

  if (!data) return null

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount)

  const dailyRevenueMap: Record<string, number> = {}

  ;(data.invoices || []).forEach((inv) => {
    const date = new Date(inv.createdAt).toLocaleDateString()

    if (!dailyRevenueMap[date]) {
      dailyRevenueMap[date] = 0
    }

    dailyRevenueMap[date] += inv.totalAmount
  })

  const dailyRevenue = Object.entries(dailyRevenueMap)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ReceiptText size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Sales performance</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Sales Dashboard
            </h1>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Sales</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.totalSales}</p>
            </div>
            <ReceiptText className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
            <BadgeIndianRupee className="text-emerald-600" size={24} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">Revenue by Day</h2>
        </div>

        {dailyRevenue.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No sales yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dailyRevenue.map(([date, amount]) => (
              <div key={date} className="flex justify-between py-3 text-sm">
                <span className="text-slate-600">{date}</span>
                <span className="font-semibold text-slate-950">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-950">Recent Sales</h2>

        {(data.invoices || []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No sales found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="p-3 text-left">Invoice</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.invoices || []).map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-700">{inv._id.slice(-6)}</td>
                    <td className="p-3 font-semibold text-slate-950">{formatCurrency(inv.totalAmount)}</td>
                    <td className="p-3 text-slate-500">{new Date(inv.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
