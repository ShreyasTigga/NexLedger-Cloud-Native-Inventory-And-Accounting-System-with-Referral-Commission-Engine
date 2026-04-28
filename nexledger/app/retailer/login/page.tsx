"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch"

export default function RetailerLoginPage() {
  const router = useRouter()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError("")
    setLoading(true)

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password
        })
      })

      if (!data) return

      if (data.role !== "retailer") {
        setError("Not a retailer account")
        setLoading(false)
        return
      }

      router.push("/retailer/dashboard")

    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-2xl font-semibold">Retailer Login</h1>
          <p className="text-sm text-blue-100">
            Access your NexLedger dashboard
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">

          {error && (
            <div className="bg-red-100 text-red-600 p-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* IDENTIFIER */}
          <div>
            <label className="text-sm font-medium">Email or Phone</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email or phone"
              className="w-full mt-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full mt-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* REGISTER CTA */}
          <p className="text-sm text-center">
            Don’t have a retailer account?{" "}
            <span
              onClick={() => router.push("/retailer/register")}
              className="text-blue-600 font-medium cursor-pointer hover:underline"
            >
              Register here
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}