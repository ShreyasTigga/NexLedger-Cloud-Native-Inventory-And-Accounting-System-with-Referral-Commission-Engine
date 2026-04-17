"use client"

import CustomerNavbar from "@/components/CustomerNavbar"

export default function CustomerLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* 🔝 Navbar */}
      <CustomerNavbar />

      {/* 🔥 Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* 🔻 Optional Footer (future-ready) */}
      <footer className="text-center text-sm text-gray-500 py-4 border-t bg-white">
        © {new Date().getFullYear()} NexLedger
      </footer>

    </div>
  )
}