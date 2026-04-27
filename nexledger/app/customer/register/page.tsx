"use client"

import { useState, FormEvent, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lockedReferral, setLockedReferral] = useState(false)

  // ================= AUTO REFERRAL =================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")

    if (ref) {
      setReferralCode(ref.toUpperCase())
      setLockedReferral(true)
    }
  }, [])

  // ================= VALIDATION =================
  function validateForm() {
    if (!name.trim() || name.length < 2) {
      setError("Name must be at least 2 characters")
      return false
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      setError("Valid phone number is required")
      return false
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email format")
      return false
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }

    if (!referralCode) {
      setError("Referral code is required")
      return false
    }

    return true
  }

  // ================= SUBMIT =================
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    try {
      setLoading(true)

      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined, // ✅ FIX
          phone,
          password,
          referralCode
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push("/customer/login")

    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md space-y-4">

        <h2 className="text-xl font-semibold text-center">
          Customer Registration
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone (required)"
            className="w-full border p-2 rounded"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email (optional)"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="text"
            placeholder="Referral Code"
            className="w-full border p-2 rounded uppercase bg-gray-50"
            value={referralCode}
            disabled={lockedReferral}
            onChange={(e) =>
              setReferralCode(
                e.target.value.replace(/\s/g, "").toUpperCase() // ✅ FIX
              )
            }
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center">
          You must have a valid referral code to join.
        </p>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => router.push("/customer/login")}
          >
            Login
          </span>
        </p>

      </div>
    </div>
  )
}