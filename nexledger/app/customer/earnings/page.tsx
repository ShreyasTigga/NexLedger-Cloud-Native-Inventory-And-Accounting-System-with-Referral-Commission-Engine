"use client"

import { useEffect, useState } from "react"

export default function EarningsPage() {

  const [earnings, setEarnings] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/customer/earnings", { credentials: "include" })
      .then(res => res.json())
      .then(setEarnings)
  }, [])

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
                <p className="text-sm text-gray-500">
                  From User: {e.fromUserId}
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