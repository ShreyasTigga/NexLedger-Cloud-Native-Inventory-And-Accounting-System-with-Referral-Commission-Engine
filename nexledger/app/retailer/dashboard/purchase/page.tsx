"use client"

import { useEffect, useState } from "react"

interface Item {
  _id: string
  name: string
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

  useEffect(() => {
    fetch("/api/inventory/items?page=1")
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
  }, [])

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
    } else {
      alert(data.error || "Error saving invoice")
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      <h2 className="text-2xl font-semibold">
        Purchase Invoice
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Invoice Number"
            className="border rounded-lg p-2"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Supplier Name"
            className="border rounded-lg p-2"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 uppercase text-xs">
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Quantity</th>
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
                      className="border rounded-lg p-2 w-full"
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option
                          key={product._id}
                          value={product._id}
                        >
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      className="border rounded-lg p-2 w-full"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      required
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      className="border rounded-lg p-2 w-full"
                      value={item.purchasePrice}
                      onChange={(e) =>
                        updateItem(index, "purchasePrice", e.target.value)
                      }
                      required
                    />
                  </td>

                  <td className="p-3 font-semibold">
                    ₹{item.quantity * item.purchasePrice}
                  </td>

                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button */}
        <button
          type="button"
          onClick={addRow}
          className="bg-gray-200 px-4 py-2 rounded-lg"
        >
          + Add Product
        </button>

        {/* Invoice Total */}
        <div className="text-right text-lg font-semibold">
          Invoice Total: ₹{invoiceTotal}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg"
        >
          Save Invoice
        </button>

      </div>
    </div>
  )
}