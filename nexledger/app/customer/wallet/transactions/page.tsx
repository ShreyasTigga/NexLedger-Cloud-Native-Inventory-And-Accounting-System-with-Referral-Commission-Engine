"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { ArrowDownCircle, ArrowUpCircle, History } from "lucide-react"

export default function TransactionsPage() {

  const [transactions, setTransactions] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const LIMIT = 20

  useEffect(() => {
    loadTransactions(1, true)
  }, [])

  async function loadTransactions(pageNumber: number, reset = false) {
    try {
      setLoading(true)

      const data = await apiFetch(
        `/api/customer/wallet/transactions?page=${pageNumber}&limit=${LIMIT}`
      )

      if (!data) return

      const newTxns = Array.isArray(data.transactions)
        ? data.transactions
        : []

      if (reset) {
        setTransactions(newTxns)
      } else {
        setTransactions((prev) => [...prev, ...newTxns])
      }

      if (newTxns.length < LIMIT) {
        setHasMore(false)
      }

      setPage(pageNumber)

    } catch (err: any) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <History size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Wallet activity</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Transaction History
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review credits, debits, referral earnings, and withdrawals.
            </p>
          </div>
        </div>
      </section>

      {transactions.length === 0 && !loading ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No transactions yet
        </div>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="divide-y divide-slate-100">
            {transactions.map((txn) => (
              <div
                key={txn._id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-lg ${
                      txn.type === "credit"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {txn.type === "credit" ? <ArrowDownCircle size={19} /> : <ArrowUpCircle size={19} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">
                      {txn.description || "Transaction"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(txn.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div
                  className={`font-semibold ${
                    txn.type === "credit"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {txn.type === "credit" ? "+" : "-"}Rs. {txn.amount}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => loadTransactions(page + 1)}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  )
}
