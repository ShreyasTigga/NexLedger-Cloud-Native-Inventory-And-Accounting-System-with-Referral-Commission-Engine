"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useCart } from "@/components/CartProvider"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD

interface Product {
  _id: string
  name: string
  sellingPrice: number
  stockQuantity: number
  category?: string
  brand?: string
}

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {

    const fetchProduct = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id

        if (!id) return

        // 🔥 USE apiFetch
        const data = await apiFetch(`/api/store/products/${id}`)

        if (!data) return

        setProduct(data)

      } catch (err: any) {
        console.error(err.message || "Failed to load product")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()

  }, [params.id])

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading product...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6 text-center text-gray-500">
        Product not found
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="grid md:grid-cols-2 gap-10">

        {/* Image placeholder */}
        <div className="bg-gray-200 rounded-xl h-80 flex items-center justify-center">
          Product Image
        </div>

        {/* Product Info */}
        <div className="space-y-4">

          <h1 className="text-3xl font-semibold">
            {product.name}
          </h1>

          <p className="text-gray-500">
            Category: {product.category || "General"}
          </p>

          {product.brand && (
            <p className="text-gray-500">
              Brand: {product.brand}
            </p>
          )}

          <p className="text-2xl font-bold">
            ₹{product.sellingPrice}
          </p>

          {product.stockQuantity > 0 ? (
            <p className="text-green-600">
              In Stock ({product.stockQuantity})
            </p>
          ) : (
            <p className="text-red-600">
              Out of Stock
            </p>
          )}

          <button
            onClick={() => {
              if (product.stockQuantity <= 0) {
                alert("Out of stock")
                return
              }

              addToCart({
                productId: product._id,
                name: product.name,
                price: product.sellingPrice,
                quantity: 1
              })
            }}
            disabled={product.stockQuantity <= 0}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Add to Cart
          </button>

        </div>

      </div>

    </div>
  )
}