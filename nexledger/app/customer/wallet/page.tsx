"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { useRouter } from "next/navigation"

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
        setTransactions(txData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">My Wallet</h1>

      {/* Wallet Summary */}
      <div className="bg-white shadow rounded p-4 space-y-2">
        <p className="text-gray-500">Wallet Balance</p>
        <h2 className="text-2xl font-bold">
          ₹{wallet?.walletBalance.toFixed(2)}
        </h2>

        <p className="text-gray-500 mt-2">Total Earnings</p>
        <h3 className="text-lg font-semibold">
          ₹{wallet?.totalEarnings.toFixed(2)}
        </h3>

        <button
          onClick={() => router.push("/customer/withdraw")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Withdraw Money
        </button>
      </div>

      {/* Transactions */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

        {transactions.length === 0 && (
          <p className="text-gray-500">No transactions yet</p>
        )}

        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="text-sm font-medium">
                  {tx.source}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`font-semibold ${
                    tx.type === "credit"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                </p>
                <p className="text-xs text-gray-500">
                  Bal: ₹{tx.balanceAfter}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}