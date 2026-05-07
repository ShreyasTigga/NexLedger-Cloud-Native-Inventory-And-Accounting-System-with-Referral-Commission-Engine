"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Wallet } from "lucide-react"

export default function WithdrawPage() {
  const router = useRouter()

  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWallet() {
      try {
        const data = await apiFetch("/api/customer/wallet")
        setBalance(data.walletBalance)
      } catch (err) {
        console.error(err)
      }
    }

    fetchWallet()
  }, [])

  async function handleWithdraw() {
    setError(null)

    const amt = Number(amount)

    if (!amt || amt <= 0) {
      setError("Enter valid amount")
      return
    }

    if (amt > balance) {
      setError("Insufficient balance")
      return
    }

    try {
      setLoading(true)

      const res = await apiFetch("/api/customer/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount: amt })
      })

      alert("Withdrawal successful")

      router.push("/customer/wallet")

    } catch (err: any) {
      setError(err.message || "Withdrawal failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ArrowUpRight size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Wallet payout</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Withdraw Money
            </h1>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Wallet size={18} className="text-blue-600" />
            Available Balance
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            Rs. {balance}
          </h2>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-4">
          <input
            type="number"
            placeholder="Enter amount"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </section>
    </div>
  )
}
