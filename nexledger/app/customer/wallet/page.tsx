"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { useRouter } from "next/navigation"
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Wallet } from "lucide-react"

interface WalletData {
  walletBalance: number
  totalEarnings: number
}

interface Transaction {
  _id: string
  type: "credit" | "debit"
  source: string
  amount: number
  balanceAfter: number
  createdAt: string
}

export default function WalletPage() {
  const router = useRouter()

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const walletData = await apiFetch("/api/customer/wallet")
        const txData = await apiFetch("/api/customer/wallet/transactions")

        setWallet(walletData)
        setTransactions(
          Array.isArray(txData?.transactions)
            ? txData.transactions
            : []
        )

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Wallet size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Wallet overview</p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                My Wallet
              </h1>
            </div>
          </div>

          <button
            onClick={() => router.push("/customer/wallet/withdraw")}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Withdraw Money
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Wallet Balance</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            Rs. {wallet?.walletBalance.toFixed(2)}
          </h2>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Earnings</p>
          <h3 className="mt-2 text-3xl font-semibold text-emerald-600">
            Rs. {wallet?.totalEarnings.toFixed(2)}
          </h3>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">Recent Transactions</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No transactions yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-lg ${
                      tx.type === "credit"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {tx.type === "credit" ? <ArrowDownCircle size={19} /> : <ArrowUpCircle size={19} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-900">
                      {tx.source}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p
                    className={`font-semibold ${
                      tx.type === "credit"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}Rs. {tx.amount}
                  </p>
                  <p className="text-xs text-slate-500">
                    Bal: Rs. {tx.balanceAfter}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
