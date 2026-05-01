"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { useRouter } from "next/navigation"

export default function WithdrawPage() {
  const router = useRouter()

  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ================= LOAD BALANCE =================
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

  // ================= SUBMIT =================
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

      alert("Withdrawal successful ✅")

      router.push("/customer/wallet")

    } catch (err: any) {
      setError(err.message || "Withdrawal failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">

      <h1 className="text-xl font-semibold">Withdraw Money</h1>

      <div className="bg-white p-4 rounded shadow">
        <p className="text-gray-500">Available Balance</p>
        <h2 className="text-2xl font-bold">₹{balance}</h2>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <input
        type="number"
        placeholder="Enter amount"
        className="border p-2 w-full rounded"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handleWithdraw}
        disabled={loading}
        className="bg-blue-600 text-white w-full p-2 rounded"
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>

    </div>
  )
}