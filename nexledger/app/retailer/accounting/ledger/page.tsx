"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { BookOpen, Filter } from "lucide-react"

interface LedgerEntry {
  _id: string
  account: string
  type: "debit" | "credit"
  amount: number
  description?: string
  createdAt: string
  referenceModel?: "Sale" | "Purchase" | "Customer" | "Referral"
}

export default function LedgerPage() {

  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const fetchLedger = async () => {
      const data = await apiFetch("/api/ledger")

      if (!data || !Array.isArray(data.entries)) {
        setEntries([])
        return
      }

      setEntries(data.entries || [])
    }

    fetchLedger()
  }, [])

  const safeEntries = Array.isArray(entries) ? entries : []

  const filteredEntries = safeEntries.filter(e => {
    if (filter === "all") return true
    return (e.referenceModel || "").toLowerCase() === filter
  })

  const getTagStyle = (type?: string) => {
    switch (type) {
      case "Sale":
        return "bg-emerald-50 text-emerald-700"
      case "Purchase":
        return "bg-rose-50 text-rose-700"
      case "Customer":
        return "bg-blue-50 text-blue-700"
      case "Referral":
        return "bg-violet-50 text-violet-700"
      default:
        return "bg-slate-100 text-slate-600"
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount)

  let balance = 0

  const sortedEntries = [...filteredEntries].reverse()

  const processed = sortedEntries.map(entry => {
    if (entry.type === "debit") {
      balance -= entry.amount
    } else {
      balance += entry.amount
    }

    return {
      ...entry,
      balance
    }
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Accounting</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Ledger
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review sale, purchase, referral, and customer ledger movement.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={17} className="text-blue-600" />
          Filter entries
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "sale", "purchase", "referral"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Credit</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {processed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No entries found
                  </td>
                </tr>
              ) : (
                processed.map(entry => (
                  <tr key={entry._id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-600">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getTagStyle(entry.referenceModel)}`}>
                        {entry.referenceModel || "Other"}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-900">{entry.account}</td>
                    <td className="p-3 text-slate-600">{entry.description || "-"}</td>
                    <td className="p-3 text-right font-medium text-rose-600">
                      {entry.type === "debit" ? formatCurrency(entry.amount) : "-"}
                    </td>
                    <td className="p-3 text-right font-medium text-emerald-600">
                      {entry.type === "credit" ? formatCurrency(entry.amount) : "-"}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-950">
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
