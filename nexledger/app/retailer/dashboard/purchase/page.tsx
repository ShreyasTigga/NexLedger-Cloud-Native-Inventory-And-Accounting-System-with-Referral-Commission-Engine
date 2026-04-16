"use client"

import { useEffect, useState } from "react"

interface Item {
  _id: string
  name: string
  sellingPrice: number
  defaultSupplierId?: {
    name: string
  }
}

interface InvoiceItem {
  productId: string
  quantity: number
  purchasePrice: number
}

export default function PurchasePage() {
  const [products, setProducts] = useState<Item[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([
    { productId: "", quantity: 0, purchasePrice: 0 }
  ])
  const [invoices, setInvoices] = useState<any[]>([])
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1)

  useEffect(() => {
    const generateInvoice = () => {
      const id = "INV-" + Date.now()
      setInvoiceNumber(id)
    }
    generateInvoice()
  }, [])

  useEffect(() => {
    fetch("/api/inventory/items?page=1&limit=100")
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
  }, [])

  // ✅ FIX 1: FETCH INVOICES ON PAGE CHANGE
  useEffect(() => {
    fetchInvoices()
  }, [invoicePage])

  const fetchInvoices = async () => {
    const res = await fetch(`/api/inventory/purchase?page=${invoicePage}`, {
      credentials: "include"
    })

    const data = await res.json()

    setInvoices(data.invoices || [])
    setInvoiceTotalPages(data.totalPages || 1)
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

      updated[index].purchasePrice = selected?.sellingPrice || 0

      setSupplierName(selected?.defaultSupplierId?.name || "Not assigned")
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

    const res = await fetch("/api/inventory/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber,
        supplierName,
        items
      })
    })

    const data = await res.json()

    if (res.ok) {
      alert("Invoice Saved Successfully ✅")
      setInvoiceNumber("")
      setSupplierName("")
      setItems([{ productId: "", quantity: 0, purchasePrice: 0 }])

      // ✅ FIX 2: REFRESH TABLE AFTER SAVE
      fetchInvoices()
    } else {
      alert(data.error || "Error saving invoice")
    }
  }

return (
  <div className="max-w-6xl mx-auto space-y-10">

    <h2 className="text-2xl font-semibold">Purchase Invoice</h2>

    {/* FORM CARD */}
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">

      {/* Invoice Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
          <label className="text-sm text-gray-500">Invoice ID</label>
          <input
            type="text"
            value={invoiceNumber}
            readOnly
            className="w-full border p-2 rounded bg-gray-100 mt-1"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">Supplier</label>
          <input
            type="text"
            value={supplierName}
            readOnly
            className="w-full border p-2 rounded bg-gray-100 mt-1"
          />
        </div>

      </div>

      {/* ITEMS TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">

          <thead>
            <tr className="border-b text-xs text-gray-500 uppercase">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Rate</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b">

                <td className="p-3">
                  <select
                    className="border p-2 rounded w-full"
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
                    className="border p-2 rounded w-full"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                  />
                </td>

                <td className="p-3">
                  <input
                    type="number"
                    className="border p-2 rounded w-full"
                    value={item.purchasePrice}
                    onChange={(e) =>
                      updateItem(index, "purchasePrice", e.target.value)
                    }
                  />
                </td>

                <td className="p-3 font-semibold">
                  ₹{item.quantity * item.purchasePrice}
                </td>

                <td className="p-3">
                  <button
                    onClick={() => removeRow(index)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between items-center">

        <button
          onClick={addRow}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          + Add Product
        </button>

        <div className="text-lg font-semibold">
          Total: ₹{invoiceTotal}
        </div>

      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Save Invoice
      </button>

    </div>

    {/* INVOICE TABLE */}
    <div className="bg-white p-6 rounded-xl shadow-md">

      <h3 className="text-lg font-semibold mb-4">Invoices</h3>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-gray-500">
            <th className="p-3">Invoice ID</th>
            <th className="p-3">Supplier</th>
            <th className="p-3">Products</th> 
            <th className="p-3">Total</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map(inv => (
            <tr key={inv._id} className="border-b">
              <td className="p-3">{inv.invoiceNumber}</td>
              <td className="p-3">{inv.supplierName}</td>
              <td className="p-3">
                {inv.items?.map((item: any, i: number) => (
                <div key={i}>
                  {item.productName ? item.productName : "Unknown Product"}
                </div>
                ))}
              </td>
              <td className="p-3">₹{inv.totalAmount}</td>
              <td className="p-3">
                {new Date(inv.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          disabled={invoicePage === 1}
          onClick={() => setInvoicePage(invoicePage - 1)}
          className="px-4 py-2 border rounded"
        >
          Prev
        </button>

        <span>
          Page {invoicePage} / {invoiceTotalPages}
        </span>

        <button
          disabled={invoicePage === invoiceTotalPages}
          onClick={() => setInvoicePage(invoicePage + 1)}
          className="px-4 py-2 border rounded"
        >
          Next
        </button>
      </div>

    </div>

  </div>
)
}