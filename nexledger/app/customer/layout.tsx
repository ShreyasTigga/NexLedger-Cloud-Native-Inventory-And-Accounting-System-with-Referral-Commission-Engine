"use client"

import CustomerNavbar from "@/components/CustomerNavbar"

export default function CustomerLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (

    <div className="min-h-screen bg-gray-100">

      <CustomerNavbar />

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>

    </div>

  )
}