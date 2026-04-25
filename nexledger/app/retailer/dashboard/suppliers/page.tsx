"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch"

interface Supplier {
  _id: string
  name: string
  phone?: string
  email?: string
}

export default function SupplierPage() {

  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: ""
  })

  const router = useRouter()

  const fetchSuppliers = async () => {
    const data = await apiFetch("/api/suppliers")

    if (!data) return

    setSuppliers(data.suppliers || [])
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const data = await apiFetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    if (!data) {
      alert("Error creating supplier")
      return
    }

    setForm({ name: "", phone: "", email: "" })

    // Navigate ONLY on success
    router.replace("/retailer/dashboard/purchase")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      <h1 className="text-2xl font-semibold">Suppliers</h1>

      {/* CREATE */}
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">

        <input
          name="name"
          placeholder="Supplier Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <button className="col-span-3 bg-blue-600 text-white p-2 rounded">
          Add Supplier
        </button>
      </form>

      {/* LIST */}
      <div className="bg-white p-6 rounded-xl shadow">
        {suppliers.length === 0 ? (
          <p>No suppliers yet</p>
        ) : (
          suppliers.map((s) => (
            <div key={s._id} className="border-b py-2">
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-gray-500">{s.phone}</p>
              <p className="text-sm text-gray-500">{s.email}</p>
            </div>
          ))
        )}
      </div>

    </div>
  )
}