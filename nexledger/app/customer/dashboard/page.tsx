"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD

export default function CustomerDashboard() {

  const [stats, setStats] = useState<any>(null)

  useEffect(() => {

    const fetchDashboard = async () => {
      try {
        // 🔥 USE apiFetch (Bearer token handled automatically)
        const data = await apiFetch("/api/customer/dashboard")

        if (!data) return

        setStats(data)

      } catch (err: any) {
        console.error(err.message || "Failed to load")
      }
    }

    fetchDashboard()

  }, [])

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-8">

      <h1 className="text-2xl font-semibold">
        Customer Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">
            {stats?.totalOrders || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold">
            ₹{stats?.totalSpent || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Referral Earnings</p>
          <p className="text-2xl font-bold">
            ₹{stats?.referralEarnings || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Wallet Balance</p>
          <p className="text-2xl font-bold">
            ₹{stats?.walletBalance || 0}
          </p>
        </div>

      </div>

    </div>
  )
}