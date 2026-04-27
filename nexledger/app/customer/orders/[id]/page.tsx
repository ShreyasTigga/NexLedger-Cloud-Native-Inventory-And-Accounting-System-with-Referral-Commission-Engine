"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD

export default function OrderPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchInvoice = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id

        if (!id) return

        // 🔥 USE apiFetch
        const data = await apiFetch(`/api/sales/${id}`)

        if (!data) return

        setInvoice(data)

      } catch (err: any) {
        console.error(err.message || "Failed to load invoice")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()

  }, [params.id])

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  if (!invoice) {
    return <div className="p-6 text-center text-gray-500">No invoice found</div>
  }

  const totalGST = invoice.items.reduce(
    (sum: number, item: any) => sum + item.gstAmount,
    0
  )

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6">
        Invoice
      </h1>

      <div className="bg-white shadow rounded-xl p-6">

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Item</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">CGST</th>
              <th className="p-2">SGST</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item: any, i: number) => (
              <tr key={i} className="border-t text-center">
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">₹{item.price}</td>
                <td className="p-2">{item.cgst}%</td>
                <td className="p-2">{item.sgst}%</td>
                <td className="p-2 font-semibold">₹{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-2 text-right">
          <p>Total GST: ₹{totalGST}</p>
          <p className="text-xl font-bold">
            Grand Total: ₹{invoice.totalAmount}
          </p>
        </div>

      </div>

    </div>
  )
}