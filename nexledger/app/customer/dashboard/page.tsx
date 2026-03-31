"use client"

import { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

interface Child {
  id: string
  name: string
  email: string
}

interface UserDetails {
  id: string
  name: string
  email: string
  referralCode: string
  walletBalance: number
  referredBy?: string
  children: Child[]
}

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawMessage, setWithdrawMessage] = useState("")

  // ================= LOAD USER =================
  async function fetchUser() {
    try {
      setLoading(true)

      const res = await fetch("/api/customers/me")
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setUser(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // ================= WITHDRAW =================
  async function handleWithdraw(e: FormEvent) {
    e.preventDefault()

    if (!user) return

    const amount = Number(withdrawAmount)

    if (amount <= 0) {
      setError("Invalid amount")
      return
    }

    if (amount > user.walletBalance) {
      setError("Insufficient balance")
      return
    }

    const res = await fetch("/api/withdrawals/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      return
    }

    setWithdrawMessage("Withdrawal requested successfully")
    setWithdrawAmount("")
    fetchUser()
  }

  if (loading) return <p className="p-5">Loading...</p>

  if (error || !user) return <p className="p-5 text-red-500">{error}</p>

  // ================= COMPUTED =================
  const referralLink = `${window.location.origin}/customer/register?ref=${user.referralCode}`

  return (
    <div className="min-h-screen bg-slate-50 p-5 space-y-5">

      {/* HEADER */}
      <div className="bg-blue-600 text-white p-5 rounded-xl">
        <h1 className="text-xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-sm">{user.email}</p>
        <p className="text-xs mt-1">
          Referral Code: <b>{user.referralCode}</b>
        </p>
      </div>

      {/* REFERRAL LINK */}
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-sm mb-2">Your Referral Link</p>

        <div className="flex gap-2">
          <input
            value={referralLink}
            readOnly
            className="flex-1 border p-2 text-xs rounded"
          />

          <button
            onClick={() => navigator.clipboard.writeText(referralLink)}
            className="bg-blue-600 text-white px-3 rounded"
          >
            Copy
          </button>
        </div>
      </div>

      {/* WALLET */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl">
          <p className="text-xs">Wallet Balance</p>
          <p className="text-xl text-green-600">₹{user.walletBalance}</p>
        </div>

        <div className="bg-white p-4 rounded-xl">
          <p className="text-xs">Referrals</p>
          <p className="text-xl">{user.children.length}</p>
        </div>
      </div>

      {/* REFERRALS */}
      <div className="bg-white p-4 rounded-xl">
        <h2 className="text-sm font-semibold mb-2">Your Referrals</h2>

        {user.children.length === 0 ? (
          <p className="text-sm text-gray-500">No referrals yet</p>
        ) : (
          user.children.map((c) => (
            <div key={c.id} className="text-sm border-b py-1">
              {c.name} ({c.email})
            </div>
          ))
        )}
      </div>

      {/* WITHDRAW */}
      <div className="bg-white p-4 rounded-xl">
        <h2 className="text-sm font-semibold mb-2">Withdraw</h2>

        <form onSubmit={handleWithdraw} className="space-y-2">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="border w-full p-2 rounded"
            placeholder="Enter amount"
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Request Withdrawal
          </button>
        </form>

        {withdrawMessage && (
          <p className="text-green-600 text-sm mt-2">{withdrawMessage}</p>
        )}
      </div>

    </div>
  )
}