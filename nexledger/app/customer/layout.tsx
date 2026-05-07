"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BadgeIndianRupee,
  LayoutDashboard,
  LogOut,
  Network,
  Store,
  Wallet
} from "lucide-react"
import { apiFetch } from "@/lib/apiFetch"

const mainLinks = [
  { name: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { name: "Referrals", href: "/customer/referrals", icon: Network },
  { name: "Wallet", href: "/customer/wallet", icon: Wallet }
]

const referralLinks = [
  { name: "Network", href: "/customer/referrals" },
  { name: "Earnings", href: "/customer/referrals/earnings" }
]

const walletLinks = [
  { name: "Overview", href: "/customer/wallet" },
  { name: "Transactions", href: "/customer/wallet/transactions" },
  { name: "Withdraw", href: "/customer/wallet/withdraw" },
  { name: "Bank", href: "/customer/wallet/bank" }
]

export default function CustomerLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isWalletRoute = pathname.startsWith("/customer/wallet")
  const isReferralRoute = pathname.startsWith("/customer/referrals")
  const subLinks = isWalletRoute ? walletLinks : isReferralRoute ? referralLinks : []

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST"
      })
    } catch {
      console.error("Logout failed")
    } finally {
      router.push("/customer-auth/login")
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/customer/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Store size={21} />
            </div>
            <div>
              <p className="text-lg font-semibold">NexLedger</p>
              <p className="text-xs text-slate-500">Customer workspace</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 overflow-x-auto">
            {mainLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon size={17} />
                  {link.name}
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        {subLinks.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 px-1 text-sm font-medium text-slate-700">
              <BadgeIndianRupee size={18} className="text-blue-600" />
              {isWalletRoute ? "Wallet" : "Referral"}
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {subLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === link.href
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}
