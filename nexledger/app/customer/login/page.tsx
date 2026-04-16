"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // ✅ important
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Login failed")
      setLoading(false)
      return
    }

    router.push("/customer/shop") // ✅ clean

  } catch (err) {
    console.error(err)
    setError("Something went wrong")
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl">

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <h1 className="text-xl font-semibold">Login</h1>
          <p className="text-sm text-blue-100">
            Access your account and referrals
          </p>
        </div>

        <div className="p-5 space-y-4">

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-center">
            Don’t have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => router.push("/auth/register")}
            >
              Register
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}