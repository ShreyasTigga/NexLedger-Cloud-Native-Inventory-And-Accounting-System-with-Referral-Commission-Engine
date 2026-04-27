"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD

export default function EarningsPage() {

  const [earnings, setEarnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchEarnings = async () => {
      try {
        const data = await apiFetch("/api/customer/earnings")

        if (!data) return

        // ✅ FIX: correct response handling
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
      <div className="p-6 text-center text-gray-500">
        Loading earnings...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Referral Earnings
      </h1>

      {earnings.length === 0 ? (
        <p>No earnings yet</p>
      ) : (
        earnings.map((e, i) => (

          <div key={i} className="border p-4 rounded-xl">

            <div className="flex justify-between">

              <div>
                <p className="font-semibold">
                  Level {e.level}
                </p>

                {/* ✅ FIXED FIELD */}
                <p className="text-sm text-gray-500">
                  From: {e.sourceCustomerId?.name || "User"}
                </p>
              </div>

              <p className="text-green-600 font-bold">
                +₹{e.amount}
              </p>

            </div>

            <p className="text-xs text-gray-400 mt-2">
              {new Date(e.createdAt).toLocaleString()}
            </p>

          </div>

        ))
      )}

    </div>
  )
}