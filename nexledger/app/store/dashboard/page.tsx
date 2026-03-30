"use client"

import { useEffect, useState } from "react"

export default function CustomerDashboard() {

  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/customer/dashboard")
      .then(res => res.json())
      .then(setStats)
  }, [])

  if (!stats) {
    return <p>Loading dashboard...</p>
  }

  return (
    <div className="space-y-8">

      <h1 className="text-2xl font-semibold">
        Customer Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold">
            ₹{stats.totalSpent}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Referral Earnings</p>
          <p className="text-2xl font-bold">
            ₹{stats.referralEarnings}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Wallet Balance</p>
          <p className="text-2xl font-bold">
            ₹{stats.walletBalance}
          </p>
        </div>

      </div>

    </div>
  )
}