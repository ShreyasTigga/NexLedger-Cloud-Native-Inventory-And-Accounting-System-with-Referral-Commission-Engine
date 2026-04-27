"use client"

import { useCart } from "@/components/CartProvider"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD

export default function CartPage() {

  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    cart,
    removeFromCart,
    clearCart,
    addToCart,
    decreaseQuantity
  } = useCart()

  const total = cart.reduce(
    (sum: number, item) => sum + item.price * item.quantity,
    0
  )

  const checkout = async () => {

    if (cart.length === 0) return

    setLoading(true)

    try {
      // ✅ STOCK VALIDATION (FIXED)
      for (const item of cart) {
        const product = await apiFetch(`/api/store/products/${item.productId}`)

        if (!product) {
          setLoading(false)
          return
        }

        if (product.stockQuantity < item.quantity) {
          alert(
            `${product.name} only has ${product.stockQuantity} items left`
          )
          setLoading(false)
          return
        }
      }

      // ✅ CHECKOUT (FIXED)
      const data = await apiFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        })
      })

      if (!data) {
        setLoading(false)
        return
      }

      // ✅ CLEAR CART
      clearCart()

      // ✅ REDIRECT TO INVOICE PAGE
      router.push(`/customer/order/${data.invoiceId}`)

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Checkout failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-2xl font-semibold mb-6">
        Your Cart
      </h1>

      {cart.length === 0 && (
        <p className="text-gray-500">
          Cart is empty
        </p>
      )}

      {cart.map((item) => (

        <div
          key={item.productId}
          className="flex justify-between border-b py-4"
        >

          <div>

            <p className="font-semibold">
              {item.name}
            </p>

            <div className="flex items-center gap-2 mt-2">

              <button
                onClick={() => decreaseQuantity(item.productId)}
                className="px-2 bg-gray-200 rounded"
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={async () => {

                  const product = await apiFetch(`/api/store/products/${item.productId}`)

                  if (!product) return

                  if (item.quantity >= product.stockQuantity) {
                    alert("Max stock reached")
                    return
                  }

                  addToCart({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: 1
                  })

                }}
                className="px-2 bg-gray-200 rounded"
              >
                +
              </button>

            </div>

          </div>

          <button
            onClick={() => removeFromCart(item.productId)}
            className="text-red-600 hover:underline"
          >
            Remove
          </button>

        </div>

      ))}

      {cart.length > 0 && (

        <div className="mt-6">

          <div className="text-xl font-semibold">
            Total: ₹{total}
          </div>

          <div className="flex gap-4 mt-4">

            <button
              onClick={checkout}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Checkout"}
            </button>

            <button
              onClick={clearCart}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Clear Cart
            </button>

          </div>

        </div>

      )}

    </div>
  )
}