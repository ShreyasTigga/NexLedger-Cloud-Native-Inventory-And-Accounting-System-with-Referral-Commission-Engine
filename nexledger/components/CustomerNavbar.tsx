"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/components/CartProvider"

export default function CustomerNavbar() {

  const { cart } = useCart()

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  return (
    <header className="bg-white shadow-sm border-b">

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link href="/customer/dashboard" className="text-xl font-bold">
          NexLedger
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">

          <Link href="/customer/shop">
            Shop
          </Link>

          <Link href="/customer/orders">
            Orders
          </Link>

          <Link href="/customer/wallet">
            Wallet
          </Link>

          {/* Cart Icon */}
          <Link
            href="/customer/cart"
            className="relative"
          >

            <ShoppingCart size={22} />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}

          </Link>

        </nav>

      </div>

    </header>
  )
}