"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users
} from "lucide-react"

const navSections = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/retailer/dashboard", icon: LayoutDashboard },
      { name: "POS", href: "/retailer/pos", icon: ShoppingCart }
    ]
  },
  {
    label: "Inventory",
    items: [
      { name: "Products", href: "/retailer/inventory/products", icon: Package },
      { name: "Purchase", href: "/retailer/inventory/purchase", icon: ShoppingCart },
      { name: "Stock History", href: "/retailer/inventory/stock-history", icon: BarChart3 }
    ]
  },
  {
    label: "Sales",
    items: [
      { name: "Invoices", href: "/retailer/sales/sales", icon: FileText },
      { name: "Customers", href: "/retailer/sales/customers", icon: Users },
      { name: "Add Customer", href: "/retailer/sales/customers/create", icon: Users }
    ]
  },
  {
    label: "Finance",
    items: [
      { name: "Ledger", href: "/retailer/accounting/ledger", icon: BookOpen },
      { name: "Referral Config", href: "/retailer/referral", icon: Settings }
    ]
  }
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const currentPage =
    navSections
      .flatMap((section) => section.items)
      .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      ?.name || "Retailer"

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      })

      if (!res.ok) {
        console.error("Logout failed")
      }
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      router.push("/retailer-auth/login")
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white px-5 py-6 shadow-sm lg:flex lg:flex-col">
        <Link href="/retailer/dashboard" className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Store size={22} />
          </div>
          <div>
            <p className="text-lg font-semibold">NexLedger</p>
            <p className="text-xs text-slate-500">Retailer workspace</p>
          </div>
        </Link>

        <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pr-1">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Retailer
              </p>
              <h1 className="text-xl font-semibold text-slate-950">
                {currentPage}
              </h1>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navSections.flatMap((section) =>
                section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                      pathname === item.href
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-81px)] p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
