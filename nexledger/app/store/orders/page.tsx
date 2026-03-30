"use client"

import { useCart } from "@/components/CartProvider"
import { useRouter } from "next/navigation"

export default function CartPage() {

  const router = useRouter()

  const { cart, removeFromCart, clearCart, addToCart, decreaseQuantity } = useCart()

  const total = cart.reduce(
    (sum: number, item) => sum + item.price * item.quantity,
    0
  )

  const checkout = async () => {

    // Validate stock first
    for (const item of cart) {

      const res = await fetch(`/api/store/products/${item.productId}`)
      const product = await res.json()

      if (product.stockQuantity < item.quantity) {
        alert(
          `${product.name} only has ${product.stockQuantity} items left in stock`
        )
        return
      }
    }

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
      clearCart()
      router.push(`/store/order/${data._id}`)
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
                onClick={() => decreaseQuantity(item.productId)}
                className="px-2 bg-gray-200 rounded"
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={async () => {

                  const res = await fetch(`/api/store/products/${item.productId}`)
                  const product = await res.json()

                  if (item.quantity >= product.stockQuantity) {
                    alert("Cannot add more than available stock")
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