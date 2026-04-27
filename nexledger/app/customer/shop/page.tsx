"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/CartProvider"
import { apiFetch } from "@/lib/apiFetch" // ✅ ADD

interface Product {
  _id: string
  name: string
  sellingPrice: number
  stockQuantity: number
  category?: string
}

export default function ShopPage() {

  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)

  const { addToCart } = useCart()

  const fetchProducts = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()

      if (search) params.append("search", search)
      if (category) params.append("category", category)

      // 🔥 FIXED
      const data = await apiFetch(`/api/store/products?${params.toString()}`)

      if (!data) return

      setProducts(data.products || [])

    } catch (err: any) {
      console.error(err.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search, category])

  return (

    <div className="max-w-6xl mx-auto space-y-6">

      <h1 className="text-3xl font-semibold">
        Shop
      </h1>

      {/* Search + Filters */}
      <div className="flex gap-4">

        <input
          type="text"
          placeholder="Search products..."
          className="border rounded-lg px-4 py-2 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded-lg px-4 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="grocery">Grocery</option>
          <option value="accessories">Accessories</option>
        </select>

      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center text-gray-500">
          Loading products...
        </p>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {products.map(product => (

          <div
            key={product._id}
            className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >

            <Link href={`/customer/product/${product._id}`}>

              <h2 className="font-semibold text-lg hover:text-blue-600">
                {product.name}
              </h2>

              <p className="text-gray-500 text-sm">
                {product.category || "General"}
              </p>

              <p className="text-xl font-bold mt-2">
                ₹{product.sellingPrice}
              </p>

              <p
                className={`text-sm ${
                  product.stockQuantity === 0
                    ? "text-red-600"
                    : product.stockQuantity < 5
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {product.stockQuantity === 0
                  ? "Out of Stock"
                  : `In Stock: ${product.stockQuantity}`}
              </p>

            </Link>

            <button
              disabled={product.stockQuantity === 0}
              onClick={() =>
                addToCart({
                  productId: product._id,
                  name: product.name,
                  price: product.sellingPrice,
                  quantity: 1
                })
              }
              className={`mt-4 w-full py-2 rounded-lg text-white ${
                product.stockQuantity === 0
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
            </button>

          </div>

        ))}

      </div>

    </div>
  )
}