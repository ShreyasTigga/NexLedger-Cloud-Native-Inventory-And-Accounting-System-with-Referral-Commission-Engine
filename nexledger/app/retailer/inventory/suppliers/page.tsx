"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch"
import { Mail, Phone, Plus, Truck } from "lucide-react"

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

    setSuppliers(Array.isArray(data?.suppliers) ? data.suppliers : [])
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

    router.replace("/retailer/inventory/purchase")
  }

  const fieldClass = "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Truck size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Inventory partners</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Suppliers
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Add supplier contact details before creating purchase invoices.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            name="name"
            placeholder="Supplier Name"
            value={form.name}
            onChange={handleChange}
            className={fieldClass}
            required
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className={fieldClass}
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className={fieldClass}
          />

          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 md:col-span-3">
            <Plus size={17} />
            Add Supplier
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-950">Supplier Directory</h2>

        {suppliers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No suppliers yet
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {suppliers.map((s) => (
              <div key={s._id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{s.name}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <Phone size={15} />
                    {s.phone || "-"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={15} />
                    {s.email || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
