"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

interface ReferralUser {
  _id: string
  name: string
  phone: string
  level: number
  createdAt: string
}

export default function ReferralsPage() {

  const [referrals, setReferrals] = useState<ReferralUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchReferrals = async () => {
      try {
        const data = await apiFetch("/api/customer/referrals")

        if (!data) return

        setReferrals(data.referrals || [])

      } catch (err: any) {
        console.error(err.message || "Failed to load referrals")
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()

  }, [])

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading referrals...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Referral Network
      </h1>

      {referrals.length === 0 ? (
        <p className="text-gray-500">
          You haven’t referred anyone yet
        </p>
      ) : (

        <div className="bg-white rounded-xl shadow divide-y">

          {referrals.map((user) => (

            <div
              key={user._id}
              className="p-4 flex justify-between items-center"
            >

              <div>
                <p className="font-semibold">
                  {user.name}
                </p>

                <p className="text-sm text-gray-500">
                  {user.phone}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-blue-600 font-semibold">
                  Level {user.level}
                </p>
              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  )
}