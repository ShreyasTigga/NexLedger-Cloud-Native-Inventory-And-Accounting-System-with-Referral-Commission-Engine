"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      <h1 className="text-xl font-semibold">Bank Accounts</h1>

      {/* Add Bank */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <input
          placeholder="Account Holder Name"
          className="border p-2 w-full"
          value={form.accountHolderName}
          onChange={(e) =>
            setForm({ ...form, accountHolderName: e.target.value })
          }
        />

        <input
          placeholder="Account Number"
          className="border p-2 w-full"
          value={form.accountNumber}
          onChange={(e) =>
            setForm({ ...form, accountNumber: e.target.value })
          }
        />

        <input
          placeholder="IFSC Code"
          className="border p-2 w-full uppercase"
          value={form.ifscCode}
          onChange={(e) =>
            setForm({
              ...form,
              ifscCode: e.target.value.toUpperCase()
            })
          }
        />

        <input
          placeholder="Bank Name"
          className="border p-2 w-full"
          value={form.bankName}
          onChange={(e) =>
            setForm({ ...form, bankName: e.target.value })
          }
        />

        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-blue-600 text-white w-full p-2 rounded"
        >
          {loading ? "Saving..." : "Add Bank"}
        </button>
      </div>

      {/* Bank List */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        {banks.length === 0 && (
          <p className="text-gray-500">No bank accounts added</p>
        )}

        {banks.map((bank) => (
          <div
            key={bank._id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{bank.bankName}</p>
              <p className="text-sm text-gray-500">
                XXXX{bank.accountNumber.slice(-4)}
              </p>
              <p className="text-xs">{bank.ifscCode}</p>
            </div>

            <div>
              {bank.isDefault ? (
                <span className="text-green-600 text-sm font-medium">
                  Default
                </span>
              ) : (
                <button
                  onClick={() => setDefault(bank._id)}
                  className="text-blue-600 text-sm"
                >
                  Set Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}