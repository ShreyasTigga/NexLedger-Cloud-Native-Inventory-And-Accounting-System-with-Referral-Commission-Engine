"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Product {
  _id: string
  name: string
  sellingPrice: number
  stockQuantity: number
  category?: string
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch("/api/store/products")
      .then(res => res.json())
      .then(data => setProducts(data))
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-3xl font-semibold mb-8">
        Store
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {products.map(product => (
          <div
            key={product._id}
            className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >

            {/* Product link */}
            <Link href={`/store/product/${product._id}`}>

              <h2 className="font-semibold text-lg hover:text-blue-600 cursor-pointer">
                {product.name}
              </h2>

              <p className="text-gray-500 text-sm">
                {product.category || "General"}
              </p>

              <p className="text-xl font-bold mt-2">
                ₹{product.sellingPrice}
              </p>

              <p className="text-sm text-green-600">
                In Stock: {product.stockQuantity}
              </p>

            </Link>

            {/* Add to cart */}
            <button
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              Add to Cart
            </button>

          </div>
        ))}

      </div>

    </div>
  )
}