"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { Minus, Plus, ReceiptText, Search, ShoppingCart, UserRound, X } from "lucide-react"

interface Product {
  _id: string
  name: string
  sellingPrice: number
}

interface CartItem {
  itemId: string
  name: string
  price: number
  quantity: number
}

interface Customer {
  _id: string
  name: string
  phone: string
}

export default function POSPage() {

  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!search) {
      setProducts([])
      return
    }

    const delay = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/pos/products?search=${search}`)
        setProducts(res?.products || [])
      } catch {
        console.error("Product search failed")
      }
    }, 300)

    return () => clearTimeout(delay)
  }, [search])

  useEffect(() => {
    if (!customerSearch) {
      setCustomers([])
      return
    }

    const delay = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/pos/customers?search=${customerSearch}`)
        setCustomers(res || [])
      } catch {
        console.error("Customer search failed")
      }
    }, 300)

    return () => clearTimeout(delay)
  }, [customerSearch])

  function addItem(product: Product) {
    setCart((prev) => {
      const exists = prev.find((i) => i.itemId === product._id)

      if (exists) {
        return prev.map((i) =>
          i.itemId === product._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }

      return [
        ...prev,
        {
          itemId: product._id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1
        }
      ]
    })

    setSearch("")
    setProducts([])
  }

  function updateQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.itemId === itemId
            ? { ...i, quantity: Math.max(1, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  function removeItem(itemId: string) {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId))
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  async function handleCheckout() {
    if (cart.length === 0) return

    try {
      setCheckoutLoading(true)

      const res = await apiFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity
          })),
          paymentMethod: "cash",
          customerId: selectedCustomer?._id || null
        })
      })

      if (!res) return

      alert("Sale completed")

      setCart([])
      setSelectedCustomer(null)

    } catch (err: any) {
      alert(err.message || "Checkout failed")
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Point of sale</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Retailer POS
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Search products, attach a customer, and complete billing quickly.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            <ShoppingCart size={18} />
            {cart.length} items
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <UserRound size={19} className="text-blue-600" />
              Customer
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                placeholder="Search customer (optional)..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            {customers.length > 0 && !selectedCustomer && (
              <div className="mt-3 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                {customers.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => {
                      setSelectedCustomer(c)
                      setCustomerSearch("")
                      setCustomers([])
                    }}
                    className="cursor-pointer border-b border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <p className="font-medium text-slate-800">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedCustomer ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div>
                  <p className="font-medium text-emerald-950">{selectedCustomer.name}</p>
                  <p className="text-sm text-emerald-700">{selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Proceeding as walk-in customer
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <Search size={19} className="text-blue-600" />
              Product Search
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                placeholder="Scan barcode or search product..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {products.length > 0 && (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                {products.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => addItem(p)}
                    className="flex cursor-pointer items-center justify-between border-b border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      ₹{p.sellingPrice}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:self-start">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ReceiptText size={19} className="text-blue-600" />
              Cart
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {cart.length} lines
            </span>
          </div>

          <div className="space-y-3">
            {cart.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No items added
              </div>
            )}

            {cart.map((item) => (
              <div
                key={item.itemId}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.itemId)}
                    className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.itemId, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.itemId, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{item.price * item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-2xl font-semibold text-slate-950">
                ₹{total}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || cart.length === 0}
              className="mt-4 w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {checkoutLoading ? "Processing..." : "Checkout"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
