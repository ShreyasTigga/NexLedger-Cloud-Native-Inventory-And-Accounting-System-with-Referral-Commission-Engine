"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch"

export default function RetailerLoginPage() {
  const router = useRouter()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleLogin() {
  setError("")

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier,
        password
      })
    })

    if (!data) return

    // 🔥 STORE TOKENS
    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)

    if (data.role !== "retailer") {
      setError("Not a retailer account")
      return
    }

    router.push("/retailer/dashboard")

  } catch (err: any) {
    setError(err.message || "Login failed")
  }
}

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Retailer Login</h1>

      <input
        placeholder="Email or Phone"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
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
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Login
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}