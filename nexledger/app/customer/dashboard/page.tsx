"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import {
  BadgeIndianRupee,
  Clock3,
  CreditCard,
  ReceiptText,
  TrendingUp,
  Wallet
} from "lucide-react"

export default function CustomerDashboard() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
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
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Loading dashboard...
      </div>
    )
  }

  const cards = [
    {
      title: "Wallet Balance",
      value: `Rs. ${stats.walletBalance || 0}`,
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Referral Earnings",
      value: `Rs. ${stats.referralEarnings || 0}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Transactions",
      value: stats.totalTransactions || 0,
      icon: CreditCard,
      color: "text-violet-600",
      bg: "bg-violet-50"
    },
    {
      title: "Orders",
      value: stats.totalOrders || 0,
      icon: ReceiptText,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Total Spent",
      value: `Rs. ${stats.totalSpent || 0}`,
      icon: BadgeIndianRupee,
      color: "text-rose-600",
      bg: "bg-rose-50"
    }
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Welcome back</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Customer Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your wallet balance, referral earnings, orders, and recent commission activity.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            <Wallet size={18} />
            Referral wallet
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {card.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            <h2 className="font-semibold text-slate-950">Earnings by Level</h2>
          </div>

          {stats.levelStats?.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No earnings yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.levelStats.map((lvl: any) => (
                <div key={lvl._id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-slate-700">Level {lvl._id}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Rs. {lvl.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 size={20} className="text-blue-600" />
            <h2 className="font-semibold text-slate-950">Recent Earnings</h2>
          </div>

          {stats.recentEarnings?.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No recent earnings
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentEarnings.map((item: any) => (
                <div key={item._id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="font-medium text-slate-900">
                      {item.sourceCustomerId?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Level {item.level}
                    </div>
                  </div>

                  <div className="text-right font-semibold text-emerald-600">
                    +Rs. {item.amount}
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
