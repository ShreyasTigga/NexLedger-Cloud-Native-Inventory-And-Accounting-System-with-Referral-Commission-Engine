"use client"

import { useEffect, useState } from "react"

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
        const res = await fetch("/api/sales", {
          credentials: "include"
        })

let json = null

try {
  json = await res.json()
} catch {
  throw new Error("Invalid server response")
}

if (!res.ok) {
  throw new Error(json?.error || "Request failed")
}

setData(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p className="p-6">Loading sales data...</p>

  if (error) return <p className="p-6 text-red-500">{error}</p>

  if (!data) return null

  // ================= HELPER =================
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount)

  // ================= DAILY REVENUE =================
  const dailyRevenueMap: Record<string, number> = {}

  data.invoices.forEach((inv) => {
    const date = new Date(inv.createdAt).toLocaleDateString()

    if (!dailyRevenueMap[date]) {
      dailyRevenueMap[date] = 0
    }

    dailyRevenueMap[date] += inv.totalAmount
  })

  const dailyRevenue = Object.entries(dailyRevenueMap)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <h1 className="text-2xl font-semibold">
        Sales Dashboard
      </h1>

      {/* ================= STATS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold">
            {data.totalSales}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data.totalRevenue)}
          </p>
        </div>

      </div>

      {/* ================= DAILY REVENUE ================= */}

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">
          Revenue by Day
        </h2>

        {dailyRevenue.length === 0 ? (
          <p className="text-sm text-gray-500">
            No sales yet
          </p>
        ) : (
          dailyRevenue.map(([date, amount]) => (
            <div
              key={date}
              className="flex justify-between text-sm py-1 border-b"
            >
              <span>{date}</span>
              <span>{formatCurrency(amount)}</span>
            </div>
          ))
        )}
      </div>

      {/* ================= RECENT SALES ================= */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-lg font-semibold mb-4">
          Recent Sales
        </h2>

        {data.invoices.length === 0 ? (
          <p className="text-sm text-gray-500">
            No sales found
          </p>
        ) : (
          <table className="min-w-full text-sm">

            <thead>
              <tr className="border-b text-gray-500 uppercase text-xs">
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>

            <tbody>

              {data.invoices.map((inv) => (

                <tr key={inv._id} className="border-b hover:bg-gray-50">

                  <td className="p-3 font-mono">
                    {inv._id.slice(-6)}
                  </td>

                  <td className="p-3">
                    {formatCurrency(inv.totalAmount)}
                  </td>

                  <td className="p-3">
                    {new Date(inv.createdAt).toLocaleString()}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>
        )}

      </div>

    </div>
  )
}