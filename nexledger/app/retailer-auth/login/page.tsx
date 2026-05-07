"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Boxes,
  Loader2,
  LockKeyhole,
  ReceiptText,
  Store
} from "lucide-react"
import { apiFetch } from "@/lib/apiFetch"

export default function RetailerLoginPage() {
  const router = useRouter()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError("")
    setLoading(true)

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password
        })
      })

      if (!data) return

      if (data.role !== "retailer") {
        setError("This account is not a retailer account.")
        setLoading(false)
        return
      }

      router.push("/retailer/dashboard")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[0.98fr_1.02fr]">
          <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/15"
            >
              <ArrowLeft size={16} />
              Home
            </Link>

            <div className="space-y-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                <Store size={26} />
              </div>

              <div>
                <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-300">
                  Store Control Center
                </p>
                <h1 className="max-w-md text-4xl font-semibold leading-tight">
                  Sign in and keep daily operations moving.
                </h1>
                <p className="mt-3 max-w-md leading-7 text-slate-300">
                  Manage products, purchases, POS billing, ledgers, and referral
                  commission rules from one operational dashboard.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <Boxes size={19} className="text-blue-300" />
                  <span className="text-sm text-slate-200">
                    Inventory and stock flow
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <ReceiptText size={19} className="text-blue-300" />
                  <span className="text-sm text-slate-200">
                    Sales, ledgers, and referrals
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-400">NexLedger</p>
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
                    <LockKeyhole size={22} />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Retailer Login
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sign in with your email or phone number.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Email or Phone
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@example.com or 9876543210"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </div>

                <p className="text-center text-sm text-slate-500">
                  Need a retailer account?{" "}
                  <Link
                    href="/retailer-auth/register"
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Register
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
