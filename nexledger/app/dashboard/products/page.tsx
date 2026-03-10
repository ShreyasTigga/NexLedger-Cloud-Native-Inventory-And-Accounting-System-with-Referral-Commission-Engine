"use client"

import { useEffect, useState } from "react"

interface Product {
  _id: string
  name: string
  sku: string
  barcode?: string
  category: string
  brand?: string
  unit: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  stockQuantity: number
  reorderLevel: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    unit: "piece",
    costPrice: "",
    sellingPrice: "",
    taxRate: "",
    reorderLevel: ""
  })

  const fetchProducts = async () => {
    const res = await fetch(
      `/api/inventory/items?search=${search}&page=${page}`
    )

    const data = await res.json()

    setProducts(data.products)
    setTotalPages(data.totalPages)
  }

  useEffect(() => {
    fetchProducts()
  }, [search, page])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch("/api/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        taxRate: Number(form.taxRate),
        reorderLevel: Number(form.reorderLevel)
      })
    })

    if (res.ok) {
      setForm({
        name: "",
        sku: "",
        barcode: "",
        category: "",
        brand: "",
        unit: "piece",
        costPrice: "",
        sellingPrice: "",
        taxRate: "",
        reorderLevel: ""
      })

      fetchProducts()
    } else {
      const error = await res.json()
      alert(error.error || "Error creating product")
    }
  }

  const deleteProduct = async (id: string) => {
    await fetch("/api/inventory/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })

    fetchProducts()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* Create Product */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-6">
          Create Product
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >

          <input
            name="name"
            placeholder="Product Name"
            className="border rounded-lg p-2"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="sku"
            placeholder="SKU"
            className="border rounded-lg p-2"
            value={form.sku}
            onChange={handleChange}
            required
          />

          <input
            name="barcode"
            placeholder="Barcode"
            className="border rounded-lg p-2"
            value={form.barcode}
            onChange={handleChange}
          />

          <input
            name="category"
            placeholder="Category"
            className="border rounded-lg p-2"
            value={form.category}
            onChange={handleChange}
            required
          />

          <input
            name="brand"
            placeholder="Brand"
            className="border rounded-lg p-2"
            value={form.brand}
            onChange={handleChange}
          />

          <select
            name="unit"
            className="border rounded-lg p-2"
            value={form.unit}
            onChange={handleChange}
          >
            <option value="piece">Piece</option>
            <option value="kg">Kg</option>
            <option value="box">Box</option>
            <option value="litre">Litre</option>
          </select>

          <input
            name="costPrice"
            type="number"
            placeholder="Cost Price"
            className="border rounded-lg p-2"
            value={form.costPrice}
            onChange={handleChange}
            required
          />

          <input
            name="sellingPrice"
            type="number"
            placeholder="Selling Price"
            className="border rounded-lg p-2"
            value={form.sellingPrice}
            onChange={handleChange}
            required
          />

          <input
            name="taxRate"
            type="number"
            placeholder="Tax Rate (%)"
            className="border rounded-lg p-2"
            value={form.taxRate}
            onChange={handleChange}
          />

          <input
            name="reorderLevel"
            type="number"
            placeholder="Reorder Level"
            className="border rounded-lg p-2"
            value={form.reorderLevel}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="md:col-span-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Create Product
          </button>

        </form>
      </div>

      {/* Search */}
      <input
        placeholder="Search by name, SKU, barcode..."
        className="border rounded-lg p-2 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Product Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 uppercase text-xs">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Barcode</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b hover:bg-gray-50">

                <td className="p-3">{p.name}</td>

                <td className="p-3">{p.sku}</td>

                <td className="p-3">{p.barcode || "-"}</td>

                <td className="p-3">{p.category}</td>

                <td className="p-3">₹{p.sellingPrice}</td>

                <td className="p-3">{p.stockQuantity}</td>

                <td className="p-3">
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => deleteProduct(p._id)}
                  >
                    Delete
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-4">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded"
        >
          Prev
        </button>

        <span>Page {page} / {totalPages}</span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded"
        >
          Next
        </button>

      </div>

    </div>
  )
}