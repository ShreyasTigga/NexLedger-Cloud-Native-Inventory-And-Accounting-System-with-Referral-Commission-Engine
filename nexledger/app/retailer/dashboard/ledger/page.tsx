"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

interface LedgerEntry {
  _id: string
  account: string
  type: "debit" | "credit"
  amount: number
  description?: string
  createdAt: string
  referenceModel?: string
}

export default function LedgerPage() {

  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
  const fetchLedger = async () => {
    const data = await apiFetch("/api/ledger")

    if (!data) return

    if (Array.isArray(data)) {
      setEntries(data)
    } else if (Array.isArray(data.entries)) {
      setEntries(data.entries)
    } else {
      setEntries([])
    }
  }

  fetchLedger()
}, [])

  const safeEntries = Array.isArray(entries) ? entries : []

  // ================= FILTER =================
const filteredEntries = safeEntries.filter(e => {
  if (filter === "all") return true

  // fallback for old entries
  if (!e.referenceModel) {
    if (filter === "purchase") return e.account === "Purchase"
    if (filter === "sale") return e.account === "Sales"
  }

  return e.referenceModel?.toLowerCase() === filter
})

  const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount)

  // ================= RUNNING BALANCE =================
  let balance = 0

  const processed = filteredEntries.map(entry => {
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">Ledger</h1>

      {/* 🔥 FILTER */}
      <div className="flex gap-3">
        {["all", "purchase", "sale"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 🔥 TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="min-w-full text-sm">

          <thead>
            <tr className="border-b text-gray-500 text-xs uppercase">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Account</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-right">Debit</th>
              <th className="p-3 text-right">Credit</th>
              <th className="p-3 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {processed.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No entries found
                </td>
              </tr>
            ) : (
              processed.map(entry => (
                <tr key={entry._id} className="border-b hover:bg-gray-50">

                  <td className="p-3">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3 font-medium">
                    {entry.account}
                  </td>

                  <td className="p-3">
                    {entry.description || "-"}
                  </td>

                  {/* DEBIT */}
                  <td className="p-3 text-right text-red-600">
                    {entry.type === "debit"
                      ? formatCurrency(entry.amount)
                      : "-"}
                  </td>

                  {/* CREDIT */}
                  <td className="p-3 text-right text-green-600">
                    {entry.type === "credit"
                      ? formatCurrency(entry.amount)
                      : "-"}
                  </td>

                  {/* BALANCE */}
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(entry.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

      </div>

    </div>
  )
}