"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RetailerRegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleRegister() {
    const res = await fetch("/api/retailer/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role: "retailer"
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      return
    }

    router.push("/retailer/login")
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
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Register
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}