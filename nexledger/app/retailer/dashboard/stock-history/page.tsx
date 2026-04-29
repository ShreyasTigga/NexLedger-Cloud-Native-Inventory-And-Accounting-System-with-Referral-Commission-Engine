"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

export default function StockHistoryPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const res = await apiFetch("/api/stock/history")

    setData(res?.movements || [])
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Stock History</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Direction</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Balance</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {data.map((m) => (
                <tr key={m._id} className="border-t">
                  <td className="p-2">{m.itemId?.name || "-"}</td>

                  <td className="p-2 capitalize">{m.type}</td>

                  <td
                    className={`p-2 font-medium ${
                      m.direction === "in"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {m.direction === "in" ? "+IN" : "-OUT"}
                  </td>

                  <td className="p-2">{m.quantity}</td>

                  <td className="p-2 font-semibold">
                    {m.stockAfter ?? "-"}
                  </td>

                  <td className="p-2 text-gray-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}