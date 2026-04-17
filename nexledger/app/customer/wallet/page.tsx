"use client"

import { useEffect, useState } from "react"

export default function WalletPage() {

  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/customer/wallet", { credentials: "include" })
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <p className="p-6">Loading...</p>

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

              <p className="text-green-600">
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