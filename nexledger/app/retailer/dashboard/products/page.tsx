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

  const [editingProduct, setEditingProduct] = useState<any>(null)

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

  // ✅ Fetch products
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

  // ✅ Form change
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // ✅ Create product
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

  // ✅ Delete
  const deleteProduct = async (id: string) => {
    await fetch("/api/inventory/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })

    fetchProducts()
  }

  // ✅ Open edit
  const openEdit = (product: any) => {
    setEditingProduct(product)
  }

  // ✅ Update product
  const updateProduct = async () => {
    const res = await fetch("/api/inventory/items", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: editingProduct._id,
        sellingPrice: Number(editingProduct.sellingPrice),
        taxRate: Number(editingProduct.taxRate)
      })
    })

    const data = await res.json()

    if (res.ok) {
      alert("Product updated")
      setEditingProduct(null)
      fetchProducts()
    } else {
      alert(data.error)
    }
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

          <input name="name" placeholder="Product Name"
            className="border rounded-lg p-2"
            value={form.name} onChange={handleChange} required />

          <input name="sku" placeholder="SKU"
            className="border rounded-lg p-2"
            value={form.sku} onChange={handleChange} required />

          <input name="barcode" placeholder="Barcode"
            className="border rounded-lg p-2"
            value={form.barcode} onChange={handleChange} />

          <input name="category" placeholder="Category"
            className="border rounded-lg p-2"
            value={form.category} onChange={handleChange} required />

          <input name="brand" placeholder="Brand"
            className="border rounded-lg p-2"
            value={form.brand} onChange={handleChange} />

          <select name="unit"
            className="border rounded-lg p-2"
            value={form.unit} onChange={handleChange}>
            <option value="piece">Piece</option>
            <option value="kg">Kg</option>
            <option value="box">Box</option>
            <option value="litre">Litre</option>
          </select>

          <input name="costPrice" type="number"
            placeholder="Cost Price"
            className="border rounded-lg p-2"
            value={form.costPrice} onChange={handleChange} required />

          <input name="sellingPrice" type="number"
            placeholder="Selling Price"
            className="border rounded-lg p-2"
            value={form.sellingPrice} onChange={handleChange} required />

          <input name="taxRate" type="number"
            placeholder="GST (%)"
            className="border rounded-lg p-2"
            value={form.taxRate} onChange={handleChange} />

          <input name="reorderLevel" type="number"
            placeholder="Reorder Level"
            className="border rounded-lg p-2"
            value={form.reorderLevel} onChange={handleChange} />

          <button
            type="submit"
            className="md:col-span-3 bg-blue-600 text-white py-2 rounded-lg"
          >
            Create Product
          </button>

        </form>
      </div>

      {/* Search */}
      <input
        placeholder="Search..."
        className="border rounded-lg p-2 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 text-xs">
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">GST</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.sku}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">₹{p.sellingPrice}</td>
                <td className="p-3">{p.taxRate}%</td>
                <td className="p-3">{p.stockQuantity}</td>

                <td className="p-3">
                  <div className="flex gap-3">
                    <button
                      className="text-blue-600"
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </button>

                    <button
                      className="text-red-600"
                      onClick={() => deleteProduct(p._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-96 space-y-4">

            <h2 className="text-lg font-semibold">Edit Product</h2>

            <input
              type="number"
              placeholder="Selling Price"
              value={editingProduct.sellingPrice}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  sellingPrice: e.target.value
                })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              placeholder="GST (%)"
              value={editingProduct.taxRate}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  taxRate: e.target.value
                })
              }
              className="w-full border p-2 rounded"
            />

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>

            </div>

          </div>

        </div>
      )}

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