"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch"

export default function CreateCustomerPage() {

  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

    return true
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    try {
      setLoading(true)

      const data = await apiFetch("/api/customer/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone,
          password
        })
      })

      if (!data) return

      alert("Customer created successfully ✅")

      router.push("/retailer/dashboard/customers")

    } catch (err: any) {
      setError(err.message || "Failed to create customer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">

      <h1 className="text-xl font-semibold">Add Customer</h1>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">

        <input
          placeholder="Full Name"
          className="border p-2 w-full rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Phone"
          className="border p-2 w-full rounded"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Email"
          className="border p-2 w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white w-full p-2 rounded"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Customer"}
        </button>

      </form>

    </div>
  )
}