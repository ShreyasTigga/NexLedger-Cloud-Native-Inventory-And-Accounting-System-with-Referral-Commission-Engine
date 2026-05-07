import Link from "next/link"
import {
  ArrowRight,
  BadgeIndianRupee,
  BookOpenCheck,
  Boxes,
  Store,
  Users
} from "lucide-react"

const highlights = [
  {
    title: "Inventory",
    text: "Products, purchases, stock history, and low-stock control.",
    icon: Boxes
  },
  {
    title: "Accounting",
    text: "Sales, purchase entries, customer wallets, and ledgers.",
    icon: BookOpenCheck
  },
  {
    title: "Referrals",
    text: "Customer networks, earnings, payouts, and commission rules.",
    icon: Users
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Store size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold">NexLedger</p>
              <p className="text-xs text-slate-500">
                Inventory, accounting, and referral operations
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/customer-auth/login"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              Customer
            </Link>
            <Link
              href="/retailer-auth/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Retailer
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <BadgeIndianRupee size={16} />
                Retail operations with referral payouts
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                  Run stock, sales, ledgers, and customer commissions from one place.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  Choose your workspace to continue. Retailers manage the store;
                  customers track referrals, earnings, and wallet activity.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/retailer-auth/login"
                className="group flex items-center justify-between rounded-lg bg-slate-950 p-5 text-white shadow-sm hover:bg-slate-800"
              >
                <div>
                  <p className="text-sm text-slate-300">Store workspace</p>
                  <p className="mt-1 text-xl font-semibold">Retailer Login</p>
                </div>
                <ArrowRight className="transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/customer-auth/login"
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-sm hover:border-blue-200"
              >
                <div>
                  <p className="text-sm text-slate-500">Referral workspace</p>
                  <p className="mt-1 text-xl font-semibold">Customer Login</p>
                </div>
                <ArrowRight className="text-blue-600 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-950">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
