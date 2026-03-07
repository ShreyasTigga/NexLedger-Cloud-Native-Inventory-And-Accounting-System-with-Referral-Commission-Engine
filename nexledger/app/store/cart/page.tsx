"use client"

import { useCart } from "@/components/CartProvider"

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart()

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-2xl font-semibold mb-6">
        Your Cart
      </h1>

      {cart.length === 0 && <p>Cart is empty</p>}

      {cart.map(item => (
        <div
          key={item.productId}
          className="flex justify-between border-b py-4"
        >
          <div>
            <p className="font-semibold">{item.name}</p>
            <p>
              ₹{item.price} × {item.quantity}
            </p>
          </div>

          <button
            onClick={() => removeFromCart(item.productId)}
            className="text-red-600"
          >
            Remove
          </button>
        </div>
      ))}

      {cart.length > 0 && (
        <>
          <div className="text-xl font-semibold mt-6">
            Total: ₹{total}
          </div>

          <button
            onClick={clearCart}
            className="mt-4 bg-gray-200 px-4 py-2 rounded"
          >
            Clear Cart
          </button>
        </>
      )}

    </div>
  )
}