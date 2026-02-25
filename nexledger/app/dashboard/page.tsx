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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchItems = async () => {
    const res = await fetch(
      `/api/inventory/items?page=${page}`
    )
    const data = await res.json()

    setItems(data.products)
    setTotalPages(data.totalPages)
  }

  useEffect(() => {
    fetchItems()
  }, [page])

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      <h2 className="text-2xl font-semibold">
        Inventory Dashboard
      </h2>

      {/* Inventory Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 uppercase text-xs">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Cost</th>
              <th className="p-3 text-left">Selling</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Inventory Value</th>
              <th className="p-3 text-left">Status</th>
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
                item.reorderLevel &&
                item.stockQuantity <= item.reorderLevel
              ) {
                status = "Low Stock"
                statusColor = "text-yellow-600"
              }

              return (
                <tr
                  key={item._id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.sku}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">₹{item.costPrice}</td>
                  <td className="p-3">₹{item.sellingPrice}</td>
                  <td className="p-3">{item.stockQuantity}</td>
                  <td className="p-3 font-semibold">
                    ₹{inventoryValue}
                  </td>
                  <td className={`p-3 ${statusColor}`}>
                    {status}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="px-4 py-2">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

    </div>
  )
}