"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { BadgeIndianRupee, TrendingUp } from "lucide-react"

export default function EarningsPage() {

  const [earnings, setEarnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchEarnings = async () => {
      try {
        const data = await apiFetch("/api/customer/earnings")

        if (!data) return

        setEarnings(data.earnings || [])

      } catch (err: any) {
        console.error(err.message || "Failed to load earnings")
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()

  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Loading earnings...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600">Referral income</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Referral Earnings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track commissions earned from your referral network.
            </p>
          </div>
        </div>
      </section>

      {earnings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No earnings yet
        </div>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-3">
            {earnings.map((e, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <BadgeIndianRupee size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Level {e.level}</p>
                      <p className="text-sm text-slate-500">
                        From: {e.sourceCustomerId?.name || "User"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-semibold text-emerald-600">
                    +Rs. {e.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
