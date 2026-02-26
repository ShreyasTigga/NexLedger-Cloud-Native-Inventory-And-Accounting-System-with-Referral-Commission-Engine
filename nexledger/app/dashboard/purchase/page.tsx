"use client"

import { useEffect, useState } from "react"

interface Item {
  _id: string
  name: string
}

export default function PurchasePage() {
  const [items, setItems] = useState<Item[]>([])
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)

  const total =
    Number(quantity || 0) * Number(price || 0)

  useEffect(() => {
    fetch("/api/inventory/items?page=1")
      .then(res => res.json())
      .then(data => setItems(data.products || []))
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    setLoading(true)

    const res = await fetch("/api/inventory/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: Number(quantity),
        purchasePrice: Number(price)
      })
    })

    const data = await res.json()

    if (res.ok) {
      alert("Stock Updated Successfully ✅")
      setProductId("")
      setQuantity("")
      setPrice("")
    } else {
      alert(data.error || "Error updating stock")
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">

      <h2 className="text-2xl font-semibold">
        Purchase Entry
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Product Select */}
          <select
            className="border rounded-lg p-2 w-full"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Select Product</option>
            {items.map(item => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Quantity */}
          <input
            type="number"
            placeholder="Quantity Received"
            className="border rounded-lg p-2 w-full"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          {/* Cost Per Unit */}
          <input
            type="number"
            placeholder="Cost Per Unit"
            className="border rounded-lg p-2 w-full"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          {/* Auto Calculated Total */}
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm text-gray-500">
              Total Purchase Value
            </p>
            <p className="text-lg font-semibold">
              ₹{total}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!productId || !quantity || !price || loading}
            className="bg-blue-600 text-white py-2 rounded-lg w-full disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Purchase"}
          </button>

        </form>
      </div>

    </div>
  )
}