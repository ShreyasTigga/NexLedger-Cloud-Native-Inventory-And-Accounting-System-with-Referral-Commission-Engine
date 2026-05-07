"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { Network, UserRound, UsersRound } from "lucide-react"

export default function ReferralsPage() {

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await apiFetch("/api/customer/referrals")
        if (!res) return
        setData(res)
      } catch (err: any) {
        console.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Network size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Referral network</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Your Referral Network
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              See who referred you and who joined through your network.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={20} className="text-blue-600" />
            <h2 className="font-semibold text-slate-950">Referred By</h2>
          </div>

          {data.referredBy ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{data.referredBy.name}</p>
              <p className="mt-1 text-sm text-slate-500">{data.referredBy.phone}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              You were directly added by retailer
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersRound size={20} className="text-blue-600" />
              <h2 className="font-semibold text-slate-950">Your Referrals</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {data.referrals.length} people
            </span>
          </div>

          {data.referrals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No referrals yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.referrals.map((user: any) => (
                <div
                  key={user._id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.phone}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    Level {user.level}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
