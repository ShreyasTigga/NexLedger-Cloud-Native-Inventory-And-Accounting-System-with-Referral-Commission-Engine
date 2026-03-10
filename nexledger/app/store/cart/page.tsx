"use client"

import { useCart } from "@/components/CartProvider"

export default function CartPage() {

  const { cart, removeFromCart, clearCart, addToCart } = useCart()

  const total = cart.reduce(
    (sum: number, item) => sum + item.price * item.quantity,
    0
  )

  const checkout = async () => {

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerName: "Walk-in Customer",
        items: cart
      })
    })

    const data = await res.json()

    if (res.ok) {
      alert("Order placed successfully")
      clearCart()
    } else {
      alert(data.error)
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
                onClick={() => removeFromCart(item.productId)}
                className="px-2 bg-gray-200 rounded"
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={() =>
                  addToCart({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: 1
                  })
                }
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Checkout
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