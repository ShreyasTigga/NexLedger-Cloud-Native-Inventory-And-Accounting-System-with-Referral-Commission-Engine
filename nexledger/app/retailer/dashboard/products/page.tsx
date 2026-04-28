"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

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
  const [viewProduct, setViewProduct] = useState<any>(null)

  const [categories, setCategories] = useState<string[]>([
    "Grocery",
    "Electronics",
    "Clothing",
    "Dairy",
    "BodyCare",
    "Luxury",
    "Others"
  ])

  const [showCustomCategory, setShowCustomCategory] = useState(false)

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

  // 🔥 Fetch products
  const fetchProducts = async () => {
    const data = await apiFetch(
      `/api/inventory/items?search=${search}&page=${page}`
    )

    if (!data) return

    setProducts(Array.isArray(data?.products) ? data.products : [])
    setTotalPages(data?.totalPages || 1)
  }

  useEffect(() => {
    fetchProducts()
  }, [search, page])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.category && !categories.includes(form.category)) {
      setCategories([...categories, form.category])
    }

    const data = await apiFetch("/api/inventory/items", {
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

    if (!data) {
      alert("Error creating product")
      return
    } else {
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
    }
  }

  const deleteProduct = async (id: string) => {
    const res = await apiFetch("/api/inventory/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })

    if (!res) {
      alert("Delete failed")
      return
    }

    fetchProducts()
  }

  const openEdit = (product: any) => {
    setEditingProduct(product)
  }

  const updateProduct = async () => {
    const data = await apiFetch("/api/inventory/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingProduct._id,
        updates: {
          sellingPrice: Number(editingProduct.sellingPrice),
          taxRate: Number(editingProduct.taxRate)
        }
      })
    })

    if (!data) {
      alert("Failed to update product")
      return
    } else {
      alert("Product updated")
      setEditingProduct(null)
      fetchProducts()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* CREATE PRODUCT */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-6">Create Product</h2>

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

          {/* CATEGORY */}
          <select
            name="category"
            value={form.category}
            onChange={(e) => {
              const value = e.target.value

              if (value === "ADD_NEW") {
                setShowCustomCategory(true)
                setForm({ ...form, category: "" })
              } else {
                setShowCustomCategory(false)
                setForm({ ...form, category: value })
              }
            }}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}

            <option value="ADD_NEW">+ Add New Category</option>
          </select>

          {showCustomCategory && (
            <input
              type="text"
              placeholder="Enter new category"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="border p-2 rounded w-full mt-2"
            />
          )}

          <input name="brand" placeholder="Brand"
            className="border rounded-lg p-2"
            value={form.brand} onChange={handleChange} />

          <select name="unit"
            className="border rounded-lg p-2"
            value={form.unit} onChange={handleChange}>
            <option value="piece">Piece</option>
            <option value="packet">Packet</option>
            <option value="kg">Kg</option>
            <option value="box">Box</option>
            <option value="litre">Litre</option>
            <option value="bottle">Bottle</option>
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

      {/* SEARCH */}
      <input
        placeholder="Search..."
        className="border rounded-lg p-2 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
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
                <td className="p-3">{p.taxRate ?? 0}%</td>
                <td className="p-3">{p.stockQuantity}</td>

                <td className="p-3">
                  <div className="flex gap-3">

                    <button
                      className="text-green-600"
                      onClick={() => setViewProduct(p)}
                    >
                      View
                    </button>

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

      {/* VIEW MODAL */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[500px] space-y-4">

            <h2 className="text-lg font-semibold">Product Details</h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><strong>Name:</strong> {viewProduct.name}</p>
              <p><strong>SKU:</strong> {viewProduct.sku}</p>
              <p><strong>Category:</strong> {viewProduct.category}</p>
              <p><strong>Cost:</strong> ₹{viewProduct.costPrice}</p>
              <p><strong>Selling:</strong> ₹{viewProduct.sellingPrice}</p>
              <p><strong>Stock:</strong> {viewProduct.stockQuantity}</p>
              <p><strong>Reorder:</strong> {viewProduct.reorderLevel}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewProduct(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4">

            <input
              type="number"
              value={editingProduct?.sellingPrice || ""}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  sellingPrice: Number(e.target.value)
                })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              value={editingProduct?.taxRate || ""}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  taxRate: Number(e.target.value)
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

      {/* PAGINATION */}
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