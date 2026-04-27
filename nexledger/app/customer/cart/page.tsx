"use client"

import { useCart } from "@/components/CartProvider"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD THIS

export default function CartPage() {

  const router = useRouter()

  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart
  } = useCart()

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const handleCheckout = async () => {
    if (cart.length === 0) return

    try {
      // 🔥 USE apiFetch (Bearer token handled automatically)
      const data = await apiFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        })
      })

      if (!data) return

      // ✅ clear cart after success
      clearCart()

      // ✅ go to orders page
      router.push("/customer/orders")

    } catch (err: any) {
      alert(err.message || "Checkout failed")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Your Cart
      </h1>

      {cart.length === 0 ? (
        <p className="text-gray-500">Cart is empty</p>
      ) : (
        cart.map(item => (

          <div
            key={item.productId}
            className="flex justify-between border p-4 rounded-lg"
          >

            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-gray-500">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-3">

              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => {
                  const qty = Math.max(1, Number(e.target.value))
                  updateQuantity(item.productId, qty)
                }}
                className="border w-16 p-1 rounded"
              />

              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-red-600"
              >
                Remove
              </button>

            </div>

          </div>

        ))
      )}

      {/* TOTAL */}
      <div className="text-right text-lg font-semibold">
        Total: ₹{total}
      </div>

      {/* CHECKOUT */}
      {cart.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleCheckout}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Checkout
          </button>
        </div>
      )}

    </div>
  )
}