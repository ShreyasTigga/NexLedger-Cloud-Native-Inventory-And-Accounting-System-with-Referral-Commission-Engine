"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  referralCode: string
  referredBy?: string | null
  type: "manual" | "referral"
}

export default function CustomersPage() {

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomers = async () => {
      const data = await apiFetch("/api/customer/list")

      if (!data) return

      setCustomers(Array.isArray(data.customers) ? data.customers : [])
      setLoading(false)
    }

    fetchCustomers()
  }, [])

  if (loading) return <p className="p-6">Loading customers...</p>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">Customers</h1>

      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="min-w-full text-sm">

          <thead>
            <tr className="border-b text-gray-500 text-xs uppercase">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Referred By</th>
              <th className="p-3 text-left">Referral Code</th>
            </tr>
          </thead>

          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">

                  <td className="p-3 font-medium">{c.name}</td>

                  <td className="p-3">{c.phone || "-"}</td>

                  <td className="p-3">{c.email || "-"}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.type === "referral"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>

                  <td className="p-3">
                    {c.referredBy || "-"}
                  </td>

                  <td className="p-3 font-mono">
                    {c.referralCode}
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>

      </div>

    </div>
  )
}