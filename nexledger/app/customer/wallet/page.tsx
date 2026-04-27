"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD

export default function WalletPage() {

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchWallet = async () => {
      try {
        const res = await apiFetch("/api/customer/wallet")

        if (!res) return

        setData({
          walletBalance: res.walletBalance || 0,
          recentEarnings: Array.isArray(res.recentEarnings)
            ? res.recentEarnings
            : []
        })

      } catch (err) {
        console.error(err)

        // ✅ Prevent crash
        setData({
          walletBalance: 0,
          recentEarnings: []
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWallet()

  }, [])

  if (loading) {
    return <p className="p-6 text-center text-gray-500">Loading wallet...</p>
  }

  if (!data) {
    return <p className="p-6 text-center text-gray-500">No data available</p>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">My Wallet</h1>

      {/* Balance */}
      <div className="bg-green-100 p-6 rounded-xl">
        <p className="text-gray-600">Wallet Balance</p>
        <p className="text-3xl font-bold text-green-700">
          ₹{data.walletBalance}
        </p>
      </div>

      {/* Recent Earnings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Recent Earnings
        </h2>

        {data.recentEarnings.length === 0 ? (
          <p>No earnings yet</p>
        ) : (
          data.recentEarnings.map((e: any, i: number) => (
            <div key={i} className="border p-4 rounded mb-2">

              <p className="font-medium">
                Level {e.level} Commission
              </p>

              <p className="text-green-600 font-semibold">
                +₹{e.amount}
              </p>

              <p className="text-sm text-gray-500">
                {new Date(e.createdAt).toLocaleString()}
              </p>

            </div>
          ))
        )}
      </div>

    </div>
  )
}