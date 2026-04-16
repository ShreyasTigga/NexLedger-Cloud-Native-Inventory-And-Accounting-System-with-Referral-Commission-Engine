"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function OrderPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/sales/${params.id}`)
      .then(res => res.json())
      .then(data => setInvoice(data))
  }, [params.id])

  if (!invoice) {
    return <div className="p-6 text-center">Loading...</div>
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