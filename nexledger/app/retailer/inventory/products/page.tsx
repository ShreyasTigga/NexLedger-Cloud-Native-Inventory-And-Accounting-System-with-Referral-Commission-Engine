"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { Edit3, Eye, PackagePlus, Search, Trash2, X } from "lucide-react"

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

  const [categories, setCategories] = useState<string[]>([])
  const [units, setUnits] = useState<string[]>([])

  const [customCategory, setCustomCategory] = useState("")
  const [customUnit, setCustomUnit] = useState("")

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    unit: "piece",

    costPrice: 0,
    sellingPrice: 0,
    taxRate: 0,
    reorderLevel: 0
  })

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

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const data = await apiFetch("/api/settings")

    if (!data) {
      setCategories(["General"])
      setUnits(["piece"])
      return
    }

    const finalCategories =
      data.categories?.length ? data.categories : ["General"]

    const finalUnits =
      data.units?.length ? data.units : ["piece"]

    setCategories(finalCategories)
    setUnits(finalUnits)

    setForm(prev => ({
      ...prev,
      unit: finalUnits.includes(prev.unit)
        ? prev.unit
        : finalUnits[0]
    }))
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    setForm(prev => ({
      ...prev,
      [name]:
        type === "number"
          ? value === "" ? 0 : Number(value)
          : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.category === "__custom__") {
      alert("Please add category first")
      return
    }

    if (form.unit === "__custom__") {
      alert("Please add unit first")
      return
    }

    console.log("FORM DATA SENT:", form)

    const data = await apiFetch("/api/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
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

        costPrice: 0,
        sellingPrice: 0,
        taxRate: 0,
        reorderLevel: 0
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

  const inputClass = "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Inventory</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Products
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Create items, manage pricing, and monitor stock in one place.
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            {products.length} products listed
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <PackagePlus size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">Create Product</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <input name="name" placeholder="Product Name" className={inputClass} value={form.name} onChange={handleChange} required />
          <input name="sku" placeholder="SKU" className={inputClass} value={form.sku} onChange={handleChange} required />
          <input name="barcode" placeholder="Barcode" className={inputClass} value={form.barcode} onChange={handleChange} />

          <div className="space-y-2">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`${inputClass} w-full`}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">+ Add New</option>
            </select>

            {form.category === "__custom__" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className={`${inputClass} w-full`}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const value = customCategory.trim()
                    if (!value) return

                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()

                    const exists = categories.some(
                      c => c.toLowerCase() === formatted.toLowerCase()
                    )

                    if (!exists) {
                      const updated = [...categories, formatted]

                      setCategories(updated)

                      await apiFetch("/api/settings", {
                        method: "POST",
                        body: JSON.stringify({
                          categories: updated,
                          units
                        })
                      })
                    }

                    setForm({ ...form, category: formatted })
                    setCustomCategory("")
                  }}
                  className="rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <input name="brand" placeholder="Brand" className={inputClass} value={form.brand} onChange={handleChange} />

          <div className="space-y-2">
            <select
              name="unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className={`${inputClass} w-full`}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </option>
              ))}
              <option value="__custom__">+ Add Unit</option>
            </select>

            {form.unit === "__custom__" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New unit"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className={`${inputClass} w-full`}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const value = customUnit.trim().toLowerCase()
                    if (!value) return

                    if (!units.includes(value)) {
                      const updated = [...units, value]

                      setUnits(updated)

                      await apiFetch("/api/settings", {
                        method: "POST",
                        body: JSON.stringify({
                          categories,
                          units: updated
                        })
                      })
                    }

                    setForm({ ...form, unit: value })
                    setCustomUnit("")
                  }}
                  className="rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <input name="costPrice" type="number" step="any" placeholder="Cost Price" className={inputClass} value={form.costPrice} onChange={handleChange} required />
          <input name="sellingPrice" type="number" step="any" placeholder="Selling Price" className={inputClass} value={form.sellingPrice} onChange={handleChange} required />
          <input name="taxRate" type="number" step="any" placeholder="GST (%)" className={inputClass} value={form.taxRate} onChange={handleChange} />
          <input name="reorderLevel" type="number" step="any" placeholder="Reorder Level" className={inputClass} value={form.reorderLevel} onChange={handleChange} />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 md:col-span-2 xl:col-span-3"
          >
            Create Product
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Product List</h2>
            <p className="mt-1 text-sm text-slate-500">Search and manage your products.</p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">GST</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.sku}</td>
                    <td className="p-3 text-slate-600">{p.category}</td>
                    <td className="p-3 font-semibold text-slate-900">₹{p.sellingPrice}</td>
                    <td className="p-3 text-slate-600">{p.taxRate ?? 0}%</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" onClick={() => setViewProduct(p)}>
                          <Eye size={16} />
                        </button>
                        <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(p)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => deleteProduct(p._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Product Details</h2>
              <button onClick={() => setViewProduct(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <p><strong>Name:</strong> {viewProduct.name}</p>
              <p><strong>SKU:</strong> {viewProduct.sku}</p>
              <p><strong>Category:</strong> {viewProduct.category}</p>
              <p><strong>Cost:</strong> ₹{viewProduct.costPrice}</p>
              <p><strong>Selling:</strong> ₹{viewProduct.sellingPrice}</p>
              <p><strong>Stock:</strong> {viewProduct.stockQuantity}</p>
              <p><strong>Reorder:</strong> {viewProduct.reorderLevel}</p>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Edit Product</h2>

            <div className="space-y-3">
              <input
                type="number"
                value={editingProduct?.sellingPrice || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    sellingPrice: Number(e.target.value)
                  })
                }
                className={`${inputClass} w-full`}
                placeholder="Selling price"
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
                className={`${inputClass} w-full`}
                placeholder="Tax rate"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setEditingProduct(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                Cancel
              </button>
              <button onClick={updateProduct} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-slate-500">Page {page} / {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
