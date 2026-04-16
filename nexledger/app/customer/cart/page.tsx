"use client"

import { useCart } from "@/components/CartProvider"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const router = useRouter()

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-gray-500 text-center">
          Your cart is empty 🛒
        </p>
      ) : (
        cart.map((item) => (
          <div
            key={item.productId}
            className="flex justify-between border p-3 rounded"
          >

            <div>
              <p className="font-medium">{item.name}</p>
              <p>₹{item.price}</p>
            </div>

            <div className="flex items-center gap-2">

              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const qty = Math.max(1, Number(e.target.value))
                  updateQuantity(item.productId, qty)
                }}
                className="border w-16 p-1"
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
      <div className="text-right font-semibold text-lg">
        Total: ₹{total}
      </div>

      {/* CHECKOUT BUTTON */}
      {cart.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => router.push("/customer/checkout")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Proceed to Checkout
          </button>
        </div>
      )}

    </div>
  )
}