"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingCart, LogOut } from "lucide-react"
import { useCart } from "@/components/CartProvider"
import { apiFetch } from "@/lib/apiFetch"

export default function CustomerNavbar() {

  const pathname = usePathname()
  const router = useRouter()
  const { cart } = useCart()

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  const linkClass = (path: string) =>
    `hover:text-blue-600 ${
      pathname === path ? "text-blue-600 font-semibold" : "text-gray-700"
    }`

  // 🔥 LOGOUT FUNCTION
  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST"
      })

      // 🔥 redirect after logout
      router.push("/customer/login")

    } catch (err) {
      console.error("Logout failed")
    }
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link
          href="/customer/shop"
          className="text-xl font-bold text-blue-600"
        >
          NexLedger
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm">

          <Link href="/customer/shop" className={linkClass("/customer/shop")}>
            Shop
          </Link>

          <Link href="/customer/orders" className={linkClass("/customer/orders")}>
            Orders
          </Link>

          <Link href="/customer/wallet" className={linkClass("/customer/wallet")}>
            Wallet
          </Link>

          <Link href="/customer/earnings" className={linkClass("/customer/earnings")}>
            Earnings
          </Link>

          {/* Cart */}
          <Link
            href="/customer/cart"
            className="relative hover:text-blue-600"
          >
            <ShoppingCart size={22} />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {/* 🔥 LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-700 hover:text-red-600"
          >
            <LogOut size={18} />
            Logout
          </button>

        </nav>

      </div>

    </header>
  )
}