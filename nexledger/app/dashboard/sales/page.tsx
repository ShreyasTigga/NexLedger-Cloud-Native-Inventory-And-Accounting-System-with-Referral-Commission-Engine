"use client"

import { useEffect, useState } from "react"

interface Invoice {
  _id: string
  totalAmount: number
  createdAt: string
}

export default function SalesDashboard() {

  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/sales/dashboard")
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <p className="p-6">Loading...</p>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <h1 className="text-2xl font-semibold">
        Sales Dashboard
      </h1>

      {/* Stats Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold">
            {data.totalSales}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">
            ₹{data.totalRevenue}
          </p>
        </div>

      </div>

      {/* Recent Sales */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-lg font-semibold mb-4">
          Recent Sales
        </h2>

        <table className="min-w-full text-sm">

          <thead>
            <tr className="border-b text-gray-500 uppercase text-xs">
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>

            {data.invoices.map((inv: Invoice) => (

              <tr key={inv._id} className="border-b">

                <td className="p-3">
                  {inv._id.slice(-6)}
                </td>

                <td className="p-3">
                  ₹{inv.totalAmount}
                </td>

                <td className="p-3">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}