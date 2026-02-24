"use client"

import { useEffect, useState } from "react"

interface Item {
  _id: string
  name: string
  sku: string
  category?: string
  costPrice: number
  sellingPrice: number
  stockQuantity: number
  reorderLevel?: number
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([])

useEffect(() => {
  fetch("/api/inventory/items")
    .then(res => res.json())
    .then(data => {
      setItems(data.products)   // 👈 IMPORTANT FIX
    })
}, [])

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* Inventory Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">
          Inventory Items
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 uppercase text-xs tracking-wider">
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Cost</th>
                <th className="p-3 text-left">Selling</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Inventory Value</th>
                <th className="p-3 text-left">Reorder Level</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const inventoryValue =
                  item.stockQuantity * item.costPrice

                let status = "Normal"
                let statusColor = "text-green-600"

                if (item.stockQuantity === 0) {
                  status = "Out of Stock"
                  statusColor = "text-red-600"
                } else if (
                  item.reorderLevel !== undefined &&
                  item.stockQuantity <= item.reorderLevel
                ) {
                  status = "Low Stock"
                  statusColor = "text-yellow-600"
                }

                return (
                  <tr
                    key={item._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium text-gray-800">
                      {item.name}
                    </td>

                    <td className="p-3 text-gray-500">
                      {item.sku}
                    </td>

                    <td className="p-3">
                      {item.category || "-"}
                    </td>

                    <td className="p-3">
                      ₹{item.costPrice}
                    </td>

                    <td className="p-3">
                      ₹{item.sellingPrice}
                    </td>

                    <td className="p-3 font-medium">
                      {item.stockQuantity}
                    </td>

                    <td className="p-3 font-semibold">
                      ₹{inventoryValue}
                    </td>

                    <td className="p-3">
                      {item.reorderLevel ?? "-"}
                    </td>

                    <td className={`p-3 font-medium ${statusColor}`}>
                      {status}
                    </td>

                    <td className="p-3 flex gap-2">
                      <button className="text-blue-600 hover:underline">
                        View
                      </button>
                      <button className="text-yellow-600 hover:underline">
                        Edit
                      </button>
                      <button className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}