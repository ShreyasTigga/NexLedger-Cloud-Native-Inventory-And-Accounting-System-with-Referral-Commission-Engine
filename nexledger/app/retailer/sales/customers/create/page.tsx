"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch"
import { UserPlus } from "lucide-react"

export default function CreateCustomerPage() {

  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState("")

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
          email: email.trim() || undefined,
          phone: phone.trim(),
          password,
          referralCode: referralCode || undefined
        })
      })

      if (!data) return

      router.push("/retailer/sales/customers")

      alert("Customer created successfully")

    } catch (err: any) {
      setError(err.message || "Failed to create customer")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <UserPlus size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Customer setup</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Add Customer
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create a customer account and optionally attach a referral code.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Full Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input placeholder="Email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          <input
            placeholder="Referral Code (optional)"
            className={`${inputClass} uppercase sm:col-span-2`}
            value={referralCode}
            onChange={(e) =>
              setReferralCode(
                e.target.value.replace(/\s/g, "").toUpperCase()
              )
            }
          />

          <button
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-2"
            disabled={loading || !name || !phone || !password}
          >
            {loading ? "Creating..." : "Create Customer"}
          </button>
        </form>
      </section>
    </div>
  )
}
