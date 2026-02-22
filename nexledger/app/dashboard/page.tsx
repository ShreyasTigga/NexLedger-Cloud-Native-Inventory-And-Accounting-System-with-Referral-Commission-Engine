"use client"

import { useEffect, useState } from "react"

interface Item {
  _id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  stockQuantity: number
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([])
  const [form, setForm] = useState({
    name: "",
    sku: "",
    costPrice: "",
    sellingPrice: ""
  })

  const fetchItems = async () => {
    const res = await fetch("/api/inventory/items")
    const data = await res.json()
    setItems(data)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await fetch("/api/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice)
      })
    })

    setForm({
      name: "",
      sku: "",
      costPrice: "",
      sellingPrice: ""
    })

    fetchItems()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            NexLedger Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Inventory Management System
          </p>
        </div>

        {/* Add Item Card */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Add New Item
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <input
              type="text"
              placeholder="Item Name"
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <input
              type="text"
              placeholder="SKU"
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.sku}
              onChange={(e) =>
                setForm({ ...form, sku: e.target.value })
              }
              required
            />

            <input
              type="number"
              placeholder="Cost Price"
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.costPrice}
              onChange={(e) =>
                setForm({ ...form, costPrice: e.target.value })
              }
              required
            />

            <input
              type="number"
              placeholder="Selling Price"
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.sellingPrice}
              onChange={(e) =>
                setForm({ ...form, sellingPrice: e.target.value })
              }
              required
            />

            <button
              type="submit"
              className="md:col-span-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Item
            </button>
          </form>
        </div>

        {/* Inventory Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Inventory Items
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 uppercase text-sm">
                  <th className="p-3">Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Selling</th>
                  <th className="p-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 text-gray-500">{item.sku}</td>
                    <td className="p-3">₹{item.costPrice}</td>
                    <td className="p-3">₹{item.sellingPrice}</td>
                    <td
                      className={`p-3 font-medium ${
                        item.stockQuantity < 5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {item.stockQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}