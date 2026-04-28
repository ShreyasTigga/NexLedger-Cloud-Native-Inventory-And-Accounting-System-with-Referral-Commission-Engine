"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

export default function ReferralConfigPage() {

  const [configs, setConfigs] = useState<any[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null)

  const [levels, setLevels] = useState(1)
  const [percentages, setPercentages] = useState<number[]>([0])
  const [commissionType, setCommissionType] = useState("percentage")
  const [maxCap, setMaxCap] = useState<number | "">("")
  const [loading, setLoading] = useState(false)

  // ================= FETCH =================
  const fetchConfigs = async () => {
    const data = await apiFetch("/api/referral/config")
    if (!data) return
    if (Array.isArray(data)) setConfigs(data)
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // ================= LOAD INTO FORM =================
  const loadConfig = (cfg: any) => {
    setSelectedConfig(cfg)
    setLevels(cfg.levels)
    setPercentages(cfg.percentages)
    setCommissionType(cfg.commissionType)
    setMaxCap(cfg.maxCommissionPerSale || "")
  }

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

  // ================= CREATE / UPDATE =================
  const saveConfig = async () => {
    setLoading(true)

    const endpoint = selectedConfig
      ? `/api/referral/config/${selectedConfig._id}`
      : "/api/referral/config"

    const method = selectedConfig ? "PUT" : "POST"

    const data = await apiFetch(endpoint, {
      method,
      body: JSON.stringify({
        levels,
        percentages,
        commissionType,
        maxCommissionPerSale: maxCap || undefined
      })
    })

    if (!data) {
      alert("Error saving config")
      setLoading(false)
      return
    }

    alert(selectedConfig ? "Updated ✅" : "Created ✅")

    resetForm()
    await fetchConfigs()
    setLoading(false)
  }

  // ================= DELETE =================
  const deleteConfig = async (id: string) => {
    if (!confirm("Delete this config?")) return

    await apiFetch(`/api/referral/config/${id}`, {
      method: "DELETE"
    })

    await fetchConfigs()
  }

  // ================= ACTIVATE =================
  const activateConfig = async (id: string) => {
    await apiFetch("/api/referral/config/activate", {
      method: "POST",
      body: JSON.stringify({ configId: id })
    })

    await fetchConfigs()
  }

  // ================= RESET =================
  const resetForm = () => {
    setSelectedConfig(null)
    setLevels(1)
    setPercentages([0])
    setCommissionType("percentage")
    setMaxCap("")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <h1 className="text-2xl font-semibold">
        Referral Configurations
      </h1>

      {/* ================= CONFIG LIST ================= */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold mb-2">All Configs</h2>

        {configs.map(cfg => (
          <div
            key={cfg._id}
            className={`border p-4 rounded flex justify-between items-center ${
              cfg.isActive ? "bg-green-50 border-green-400" : ""
            }`}
          >
            <div>
              <p className="font-semibold">
                {cfg.isActive ? "🟢 Active" : "⚪ Inactive"}
              </p>
              <p>Levels: {cfg.levels}</p>
              <p>{cfg.percentages.join(" %, ")} %</p>
            </div>

            <div className="space-x-2">
              <button
                onClick={() => loadConfig(cfg)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Edit
              </button>

              {!cfg.isActive && (
                <button
                  onClick={() => activateConfig(cfg._id)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Activate
                </button>
              )}

              <button
                onClick={() => deleteConfig(cfg._id)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= FORM ================= */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        <h2 className="font-semibold">
          {selectedConfig ? "Edit Config" : "Create New Config"}
        </h2>

        {/* LEVELS */}
        <input
          type="number"
          min={1}
          value={levels}
          onChange={(e) => handleLevelChange(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />

        {/* PERCENTAGES */}
        {percentages.map((p, i) => (
          <input
            key={i}
            type="number"
            placeholder={`Level ${i + 1}`}
            value={p}
            onChange={(e) => updatePercentage(i, Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        ))}

        {/* TYPE */}
        <select
          value={commissionType}
          onChange={(e) => setCommissionType(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>

        {/* MAX CAP */}
        <input
          type="number"
          placeholder="Max cap"
          value={maxCap}
          onChange={(e) =>
            setMaxCap(e.target.value ? Number(e.target.value) : "")
          }
          className="border p-2 rounded w-full"
        />

        <div className="flex gap-2">
          <button
            onClick={saveConfig}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            {loading ? "Saving..." : selectedConfig ? "Update" : "Create"}
          </button>

          {selectedConfig && (
            <button
              onClick={resetForm}
              className="bg-gray-400 text-white px-6 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}