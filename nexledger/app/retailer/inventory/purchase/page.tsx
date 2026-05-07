"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { FileText, PackagePlus, Plus, ReceiptText, Trash2, Truck } from "lucide-react"

interface Item {
  _id: string
  name: string
  sellingPrice: number
  costPrice: number
}

interface InvoiceItem {
  productId: string
  quantity: number
  purchasePrice: number
}

export default function PurchasePage() {
  const [products, setProducts] = useState<Item[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([
    { productId: "", quantity: 0, purchasePrice: 0 }
  ])

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierId, setSupplierId] = useState("")

  const [invoices, setInvoices] = useState<any[]>([])
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1)

  useEffect(() => {
    setInvoiceNumber("INV-" + Date.now())
  }, [])

  useEffect(() => {
    apiFetch("/api/inventory/items?page=1&limit=100")
      .then(data => {
        if (!data) return
        setProducts(Array.isArray(data?.products) ? data.products : [])
      })
  }, [])

  useEffect(() => {
    apiFetch("/api/suppliers")
      .then(data => {
        if (!data) return
        setSuppliers(Array.isArray(data?.suppliers) ? data.suppliers : [])
      })
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [invoicePage])

  const fetchInvoices = async () => {
    const data = await apiFetch(`/api/inventory/purchase?page=${invoicePage}`)

    if (!data) return

    setInvoices(Array.isArray(data?.invoices) ? data.invoices : [])
    setInvoiceTotalPages(data?.totalPages || 1)
  }

  const addRow = () => {
    setItems([...items, { productId: "", quantity: 0, purchasePrice: 0 }])
  }

  const removeRow = (index: number) => {
    const updated = [...items]
    updated.splice(index, 1)
    setItems(updated)
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]

    if (field === "productId") {
      const selected = products.find(p => p._id === value)

      console.log("SELECTED PRODUCT:", selected)

      updated[index].purchasePrice = selected?.costPrice || 0
    }

    updated[index] = {
      ...updated[index],
      [field]:
        field === "quantity" || field === "purchasePrice"
          ? Number(value)
          : value
    }

    setItems(updated)
  }

  const invoiceTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.purchasePrice,
    0
  )

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    console.log("FORM ITEMS BEFORE SUBMIT:", items)

    if (!supplierId) {
      alert("Please select a supplier")
      return
    }

    const data = await apiFetch("/api/inventory/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber,
        supplierId,
        items
      })
    })

    if (!data) {
      alert("Error saving invoice")
      return
    }

    alert("Invoice Saved Successfully")

    setInvoiceNumber("INV-" + Date.now())
    setSupplierId("")
    setItems([{ productId: "", quantity: 0, purchasePrice: 0 }])

    fetchInvoices()
  }

  const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Inventory purchase</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Purchase Invoice
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Record supplier purchases and update stock with cleaner invoice entry.
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            Total: ₹{invoiceTotal}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <PackagePlus size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">New Purchase</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600">Invoice ID</label>
            <input
              type="text"
              value={invoiceNumber}
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className={`mt-1 ${fieldClass}`}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => window.location.href = "/retailer/inventory/suppliers"}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus size={15} />
              Add Supplier
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Qty</th>
                <th className="p-3 text-left">Rate</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="p-3">
                    <select
                      className={fieldClass}
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      className={fieldClass}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      className={fieldClass}
                      value={item.purchasePrice}
                      onChange={(e) =>
                        updateItem(index, "purchasePrice", e.target.value)
                      }
                    />
                  </td>

                  <td className="p-3 font-semibold text-slate-900">
                    ₹{item.quantity * item.purchasePrice}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => removeRow(index)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={addRow}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Plus size={16} />
            Add Product
          </button>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-950">
            Total: ₹{invoiceTotal}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
        >
          <ReceiptText size={17} />
          Save Invoice
        </button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          <h3 className="font-semibold text-slate-950">Invoices</h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="p-3 text-left">Invoice ID</th>
                <th className="p-3 text-left">Supplier</th>
                <th className="p-3 text-left">Products</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-3 text-slate-600">{inv.supplierId?.name}</td>
                    <td className="p-3 text-slate-600">
                      {inv.items?.map((item: any, i: number) => (
                        <div key={i}>{item.productName || "Unknown"}</div>
                      ))}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">₹{inv.totalAmount}</td>
                    <td className="p-3 text-slate-500">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            disabled={invoicePage === 1}
            onClick={() => setInvoicePage(invoicePage - 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {invoicePage} / {invoiceTotalPages}
          </span>
          <button
            disabled={invoicePage === invoiceTotalPages}
            onClick={() => setInvoicePage(invoicePage + 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  )
}
