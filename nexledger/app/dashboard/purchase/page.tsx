"use client"

import { useEffect, useState } from "react"

interface Item {
  _id: string
  name: string
}

interface Supplier {
  _id: string
  name: string
}

export default function PurchasePage() {
  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedItem, setSelectedItem] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [quantity, setQuantity] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")

  useEffect(() => {
    fetch("/api/inventory/items")
      .then(res => res.json())
      .then(setItems)

    fetch("/api/inventory/suppliers")
      .then(res => res.json())
      .then(setSuppliers)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch("/api/inventory/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: selectedSupplier,
        invoiceNumber,
        items: [
          {
            itemId: selectedItem,
            quantity: Number(quantity),
            costPrice: Number(costPrice)
          }
        ]
      })
    })

    if (res.ok) {
      alert("Purchase Invoice Created ✅")
      setQuantity("")
      setCostPrice("")
      setInvoiceNumber("")
    } else {
      alert("Error creating invoice")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-semibold text-gray-800">
        Create Purchase Invoice
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Invoice Number"
            className="w-full border rounded-lg p-2"
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            required
          />

          <select
            className="w-full border rounded-lg p-2"
            value={selectedSupplier}
            onChange={e => setSelectedSupplier(e.target.value)}
            required
          >
            <option value="">Select Supplier</option>
            {suppliers.map(s => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            className="w-full border rounded-lg p-2"
            value={selectedItem}
            onChange={e => setSelectedItem(e.target.value)}
            required
          >
            <option value="">Select Item</option>
            {items.map(i => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantity"
            className="w-full border rounded-lg p-2"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Cost Price"
            className="w-full border rounded-lg p-2"
            value={costPrice}
            onChange={e => setCostPrice(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Invoice
          </button>
        </form>
      </div>
    </div>
  )
}