"use client"

import { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

interface Child {
  id: string
  name: string
  email?: string
}

interface UserDetails {
  id: string
  name: string
  email?: string
  phone?: string
  referralCode: string
  walletBalance: number
  referredBy?: string
  children: Child[]
}

interface ReferralEarning {
  _id: string
  amount: number
  level: number
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserDetails | null>(null)
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [message, setMessage] = useState("")

  // ================= FETCH USER =================
  async function fetchData() {
    try {
      setLoading(true)

      const res = await fetch("/api/customer/me")
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setUser(data.user)
      setEarnings(data.earnings)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ================= WITHDRAW =================
  async function handleWithdraw(e: FormEvent) {
    e.preventDefault()

    const amount = Number(withdrawAmount)

    if (!amount || amount <= 0) {
      setError("Invalid amount")
      return
    }

    if (amount > (user?.walletBalance || 0)) {
      setError("Insufficient balance")
      return
    }

    const res = await fetch("/api/withdrawals/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      return
    }

    setMessage("Withdrawal requested successfully")
    setWithdrawAmount("")
    fetchData()
  }

  if (loading) return <p className="p-6">Loading...</p>

  if (error || !user)
    return <p className="p-6 text-red-500">{error}</p>

  // ================= COMPUTED =================
  const totalEarnings = earnings.reduce(
    (sum, e) => sum + e.amount,
    0
  )

  const referralLink = `${window.location.origin}/customer/register?ref=${user.referralCode}`

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-blue-600 text-white p-5 rounded-xl">
        <h1 className="text-xl font-semibold">
          Welcome, {user.name}
        </h1>
        <p className="text-sm">{user.email || user.phone}</p>
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

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs">Wallet Balance</p>
          <p className="text-xl text-green-600">
            ₹{user.walletBalance}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs">Total Earnings</p>
          <p className="text-xl text-blue-600">
            ₹{totalEarnings}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs">Referrals</p>
          <p className="text-xl">
            {user.children.length}
          </p>
        </div>

      </div>

      {/* REFERRALS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-sm font-semibold mb-2">
          Your Referrals
        </h2>

        {user.children.length === 0 ? (
          <p className="text-sm text-gray-500">
            No referrals yet
          </p>
        ) : (
          user.children.map((c) => (
            <div key={c.id} className="text-sm border-b py-1">
              {c.name}
            </div>
          ))
        )}
      </div>

      {/* EARNINGS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-sm font-semibold mb-2">
          Referral Earnings
        </h2>

        {earnings.length === 0 ? (
          <p className="text-sm text-gray-500">
            No earnings yet
          </p>
        ) : (
          earnings.map((e) => (
            <div key={e._id} className="flex justify-between text-sm py-1">
              <span>Level {e.level}</span>
              <span>₹{e.amount}</span>
            </div>
          ))
        )}
      </div>

      {/* WITHDRAW */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-sm font-semibold mb-2">
          Withdraw
        </h2>

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

        {message && (
          <p className="text-green-600 text-sm mt-2">
            {message}
          </p>
        )}
      </div>

    </div>
  )
}