"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { RefreshCw, Users } from "lucide-react"

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  referralCode: string
  referredBy?: string | null
  type: "manual" | "referral"
}

export default function CustomersPage() {

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchCustomers() {
    try {
      setLoading(true)

      const data = await apiFetch("/api/customer/list")

      if (!data) {
        setError("Failed to load customers")
        return
      }

      setCustomers(Array.isArray(data.customers) ? data.customers : [])

    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading customers...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Sales contacts</p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Customers
              </h1>
            </div>
          </div>

          <button
            onClick={fetchCustomers}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Referred By</th>
                <th className="p-3 text-left">Referral Code</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{c.name || "Unknown"}</td>
                    <td className="p-3 text-slate-600">{c.phone || "-"}</td>
                    <td className="p-3 text-slate-600">{c.email || "-"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          c.type === "referral"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{c.referredBy || "-"}</td>
                    <td className="p-3 font-mono text-xs text-slate-700">{c.referralCode}</td>
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
