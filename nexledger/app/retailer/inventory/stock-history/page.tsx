"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react"

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
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <History size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Inventory audit</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Stock History
            </h1>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading...
        </div>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Direction</th>
                  <th className="p-3 text-left">Quantity</th>
                  <th className="p-3 text-left">Balance</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No stock movements found
                    </td>
                  </tr>
                ) : (
                  data.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{m.itemId?.name || "-"}</td>
                      <td className="p-3 capitalize text-slate-600">{m.type}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                            m.direction === "in"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {m.direction === "in" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          {m.direction === "in" ? "IN" : "OUT"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{m.quantity}</td>
                      <td className="p-3 font-semibold text-slate-900">{m.stockAfter ?? "-"}</td>
                      <td className="p-3 text-slate-500">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
