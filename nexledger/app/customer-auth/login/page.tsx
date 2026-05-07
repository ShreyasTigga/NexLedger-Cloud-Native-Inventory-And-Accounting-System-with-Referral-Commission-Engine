"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BadgeIndianRupee,
  Loader2,
  Network,
  Wallet
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login failed")
      }

      if (data.role !== "customer") {
        setError("This account is not a customer account.")
        setLoading(false)
        return
      }

      router.push("/customer/dashboard")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="hidden bg-blue-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm text-blue-50 hover:bg-white/20"
            >
              <ArrowLeft size={16} />
              Home
            </Link>

            <div className="space-y-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-blue-700">
                <Network size={26} />
              </div>

              <div>
                <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-100">
                  Referral Portal
                </p>
                <h1 className="max-w-md text-4xl font-semibold leading-tight">
                  See earnings, network activity, and wallet updates.
                </h1>
                <p className="mt-3 max-w-md leading-7 text-blue-50">
                  Track referral earnings, wallet balance, bank details, and
                  payout activity with clear navigation.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-3">
                  <BadgeIndianRupee size={19} className="text-blue-50" />
                  <span className="text-sm text-blue-50">
                    Wallet and earnings summary
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-3">
                  <Network size={19} className="text-blue-50" />
                  <span className="text-sm text-blue-50">
                    Referral network tracking
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-blue-50">
              <Wallet size={17} />
              Referral wallet access
            </div>
          </section>

          <section className="flex items-center p-6 sm:p-10">
            <div className="w-full">
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950 lg:hidden"
              >
                <ArrowLeft size={16} />
                Home
              </Link>

              <div className="mx-auto max-w-md space-y-7">
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Wallet size={22} />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Customer Login
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sign in to view referrals, earnings, and wallet activity.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Email or Phone
                    </span>
                    <input
                      type="text"
                      placeholder="name@example.com or 9876543210"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Password
                    </span>
                    <input
                      type="password"
                      placeholder="Enter password"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p className="text-center text-sm text-slate-500">
                  Are you a retailer?{" "}
                  <Link
                    href="/retailer-auth/login"
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Go to retailer login
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
