"use client"

import { useEffect, useState } from "react"

export default function ReferralConfigPage() {

  const [levels, setLevels] = useState(1)
  const [percentages, setPercentages] = useState<number[]>([0])
  const [commissionType, setCommissionType] = useState("percentage")
  const [maxCommission, setMaxCommission] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // ================= LOAD CONFIG =================
  async function loadConfig() {
    const res = await fetch("/api/referral/config")
    const data = await res.json()

    if (data) {
      setLevels(data.levels)
      setPercentages(data.percentages)
      setCommissionType(data.commissionType)
      setMaxCommission(data.maxCommissionPerSale || "")
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  // ================= HANDLE LEVEL CHANGE =================
  function handleLevelChange(val: number) {
    setLevels(val)

    const newArr = Array(val)
      .fill(0)
      .map((_, i) => percentages[i] || 0)

    setPercentages(newArr)
  }

  // ================= HANDLE % CHANGE =================
  function updatePercentage(index: number, value: number) {
    const updated = [...percentages]
    updated[index] = value
    setPercentages(updated)
  }

  // ================= SUBMIT =================
  async function handleSubmit() {
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/referral/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        levels,
        percentages,
        commissionType,
        maxCommissionPerSale: maxCommission
          ? Number(maxCommission)
          : undefined
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.error)
    } else {
      setMessage("Config updated successfully ✅")
    }

    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Referral System Settings
      </h1>

      {/* LEVELS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <label className="block text-sm mb-2">
          Number of Levels
        </label>

        <input
          type="number"
          value={levels}
          min={1}
          onChange={(e) =>
            handleLevelChange(Number(e.target.value))
          }
          className="border p-2 w-full rounded"
        />
      </div>

      {/* TYPE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <label className="block text-sm mb-2">
          Commission Type
        </label>

        <select
          value={commissionType}
          onChange={(e) => setCommissionType(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (₹)</option>
        </select>
      </div>

      {/* PERCENTAGES */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-sm font-semibold mb-3">
          Level Commissions
        </h2>

        {percentages.map((val, i) => (
          <div key={i} className="mb-3">

            <label className="text-xs">
              Level {i + 1}
            </label>

            <input
              type="number"
              value={val}
              onChange={(e) =>
                updatePercentage(i, Number(e.target.value))
              }
              className="border p-2 w-full rounded"
            />
          </div>
        ))}
      </div>

      {/* MAX CAP */}
      <div className="bg-white p-4 rounded-xl shadow">
        <label className="block text-sm mb-2">
          Max Commission Per Sale (optional)
        </label>

        <input
          type="number"
          value={maxCommission}
          onChange={(e) =>
            setMaxCommission(e.target.value)
          }
          className="border p-2 w-full rounded"
        />
      </div>

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {loading ? "Saving..." : "Save Configuration"}
      </button>

      {/* MESSAGE */}
      {message && (
        <p className="text-sm text-green-600">
          {message}
        </p>
      )}

    </div>
  )
}