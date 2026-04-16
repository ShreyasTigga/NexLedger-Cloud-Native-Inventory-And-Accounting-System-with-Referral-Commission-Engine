"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RetailerRegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState("") // 🔥 NEW

  async function handleRegister() {
    setError("")

    // 🔴 Basic validation
    if (!name || !email || !password) {
      setError("All fields are required")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      setLoading(true)

      const res = await fetch("/api/retailer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }

      // 🔥 SHOW referral code
      setReferralCode(data.referralCode)

    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">

      <h1 className="text-xl font-semibold">
        Retailer Register
      </h1>

      <input
        placeholder="Business Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full rounded"
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full rounded"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full rounded"
      />

      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* 🔥 SHOW REFERRAL CODE */}
      {referralCode && (
        <div className="bg-green-100 p-4 rounded text-center space-y-2">
          <p className="font-medium">Registration Successful 🎉</p>

          <p className="text-sm text-gray-600">
            Your Referral Code:
          </p>

          <p className="text-xl font-bold text-green-700">
            {referralCode}
          </p>

          <p className="text-xs text-gray-500">
            Share this with customers to onboard them
          </p>

          <button
            onClick={() => router.push("/retailer/login")}
            className="mt-2 text-blue-600 underline"
          >
            Go to Login →
          </button>
        </div>
      )}

    </div>
  )
}