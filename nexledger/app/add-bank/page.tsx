"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function AddBankPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    fullName: "",
    bankName: "",
    accountNumber: "",
    ifsc: ""
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc)) {
      setError("Invalid IFSC")
      return
    }

    const res = await fetch("/api/bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      return
    }

    setSuccess("Saved successfully")

    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow w-full max-w-md space-y-3"
      >
        <h1 className="text-lg font-semibold">Add Bank Account</h1>

        <input
          placeholder="Full Name"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({ ...form, fullName: e.target.value })
          }
        />

        <input
          placeholder="Bank Name"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({ ...form, bankName: e.target.value })
          }
        />

        <input
          placeholder="Account Number"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({ ...form, accountNumber: e.target.value })
          }
        />

        <input
          placeholder="IFSC"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({ ...form, ifsc: e.target.value.toUpperCase() })
          }
        />

        <button className="bg-blue-600 text-white w-full py-2 rounded">
          Save
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>
    </div>
  )
}