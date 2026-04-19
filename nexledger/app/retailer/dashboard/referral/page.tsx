"use client"

import { useEffect, useState } from "react"

export default function ReferralConfigPage() {

  const [levels, setLevels] = useState(1)
  const [percentages, setPercentages] = useState<number[]>([0])
  const [commissionType, setCommissionType] = useState("percentage")
  const [maxCap, setMaxCap] = useState<number | "">("")
  const [loading, setLoading] = useState(false)

  // ================= FETCH =================
  useEffect(() => {
    fetch("/api/referral-config", {credentials: "include"})
      .then(res => res.json())
      .then(data => {
        if (!data) return

        setLevels(data.levels)
        setPercentages(data.percentages)
        setCommissionType(data.commissionType)
        setMaxCap(data.maxCommissionPerSale || "")
      })
  }, [])

  // ================= LEVEL CHANGE =================
  const handleLevelChange = (value: number) => {
    setLevels(value)

    const updated = Array.from({ length: value }, (_, i) => percentages[i] || 0)
    setPercentages(updated)
  }

  const updatePercentage = (index: number, value: number) => {
    const updated = [...percentages]
    updated[index] = value
    setPercentages(updated)
  }

  // ================= SAVE =================
  const saveConfig = async () => {
    setLoading(true)

    const res = await fetch("/api/referral/config", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        levels,
        percentages,
        commissionType,
        maxCommissionPerSale: maxCap || undefined,
        isActive: true
      })
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error)
    } else {
      alert("Config saved successfully ✅")
    }

    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Referral Configuration
      </h1>

      {/* LEVELS */}
      <div>
        <label className="block mb-1">Levels</label>
        <input
          type="number"
          min={1}
          value={levels}
          onChange={(e) => handleLevelChange(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* PERCENTAGES */}
      <div className="space-y-2">
        <label>Commission per Level</label>

        {percentages.map((p, i) => (
          <input
            key={i}
            type="number"
            placeholder={`Level ${i + 1}`}
            value={p}
            onChange={(e) =>
              updatePercentage(i, Number(e.target.value))
            }
            className="border p-2 rounded w-full"
          />
        ))}
      </div>

      {/* TYPE */}
      <div>
        <label>Commission Type</label>
        <select
          value={commissionType}
          onChange={(e) => setCommissionType(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
      </div>

      {/* MAX CAP */}
      <div>
        <label>Max Commission Per Sale (optional)</label>
        <input
          type="number"
          value={maxCap}
          onChange={(e) => setMaxCap(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* SAVE */}
      <button
        onClick={saveConfig}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {loading ? "Saving..." : "Save Config"}
      </button>

    </div>
  )
}