"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BookOpen,
  LogOut,
  Settings
} from "lucide-react"

export default function DashboardLayout({
  children
}: {
  children: ReactNode
}) {
  const pathname = usePathname()

  const BASE = "/retailer/dashboard"

  const navItems = [
    { name: "Dashboard", href: BASE, icon: LayoutDashboard },
    { name: "Products", href: `${BASE}/products`, icon: Package },
    { name: "Purchase", href: `${BASE}/purchase`, icon: ShoppingCart },
    { name: "Sales", href: `${BASE}/sales`, icon: ShoppingCart },
    { name: "Ledger", href: `${BASE}/ledger`, icon: BookOpen },
    { name: "Referral Config", href: `${BASE}/referral`, icon: Settings }
  ]

  const handleLogout = async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  })

  window.location.href = "/retailer/login"
}

  const userName = "Admin User"

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">

      {/* Sidebar (FIXED) */}
      <aside className="w-64 bg-white shadow-md border-r p-6 flex flex-col justify-between fixed left-0 top-0 h-full">

        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <LayoutDashboard className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold text-blue-600">
              NexLedger
            </h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Logout */}
        <button
  onClick={handleLogout}
  className="flex items-center gap-2 text-red-500 hover:text-red-600 transition"
>
  <LogOut size={18} />
  Logout
</button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 h-full">

        {/* Top Navbar (STICKY OPTIONAL) */}
        <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{userName}</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-10">
          {children}
        </main>
      </div>
    </div>
  )
}