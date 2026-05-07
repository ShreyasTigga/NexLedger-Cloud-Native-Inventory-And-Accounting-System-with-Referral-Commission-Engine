"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { BadgeCheck, Building2, Landmark } from "lucide-react"

interface Bank {
  _id: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  isDefault: boolean
}

export default function BankPage() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [form, setForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  })
  const [loading, setLoading] = useState(false)

  async function fetchBanks() {
    const data = await apiFetch("/api/customer/bank")
    setBanks(data)
  }

  useEffect(() => {
    fetchBanks()
  }, [])

  async function handleAdd() {
    try {
      setLoading(true)

      await apiFetch("/api/customer/bank", {
        method: "POST",
        body: JSON.stringify(form)
      })

      setForm({
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: ""
      })

      fetchBanks()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function setDefault(bankId: string) {
    await apiFetch("/api/customer/bank/default", {
      method: "POST",
      body: JSON.stringify({ bankId })
    })

    fetchBanks()
  }

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Landmark size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Payout setup</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Bank Accounts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Add and select a default account for wallet withdrawals.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-950">Add Bank Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Account Holder Name" className={inputClass} value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} />
          <input placeholder="Account Number" className={inputClass} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          <input placeholder="IFSC Code" className={`${inputClass} uppercase`} value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
          <input placeholder="Bank Name" className={inputClass} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          <button
            onClick={handleAdd}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-2"
          >
            {loading ? "Saving..." : "Add Bank"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-950">Saved Accounts</h2>

        {banks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No bank accounts added
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {banks.map((bank) => (
              <div key={bank._id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{bank.bankName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        XXXX{bank.accountNumber.slice(-4)}
                      </p>
                      <p className="text-xs text-slate-500">{bank.ifscCode}</p>
                    </div>
                  </div>

                  {bank.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      <BadgeCheck size={14} />
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefault(bank._id)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
