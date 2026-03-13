"use client"

import Link from "next/link"

export default function CustomerLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6">

        <h1 className="text-xl font-bold mb-8">
          NexLedger
        </h1>

        <nav className="flex flex-col gap-4 text-gray-700">

          <Link href="/customer/dashboard">
            Dashboard
          </Link>

          <Link href="/customer/shop">
            Shop
          </Link>

          <Link href="/customer/orders">
            My Orders
          </Link>

          <Link href="/customer/referrals">
            Referrals
          </Link>

          <Link href="/customer/wallet">
            Wallet
          </Link>

        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>

    </div>
  )
}