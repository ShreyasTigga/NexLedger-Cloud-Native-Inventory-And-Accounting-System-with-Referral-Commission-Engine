"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { CheckCircle2, Network, Pencil, Plus, Trash2, X } from "lucide-react"

export default function ReferralConfigPage() {

  const [configs, setConfigs] = useState<any[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null)

  const [name, setName] = useState("")
  const [levels, setLevels] = useState(1)
  const [percentages, setPercentages] = useState<number[]>([0])
  const [commissionType, setCommissionType] = useState("percentage")
  const [distribution, setDistribution] = useState(100)
  const [maxCap, setMaxCap] = useState<number | "">("")
  const [loading, setLoading] = useState(false)

  const fetchConfigs = async () => {
    const data = await apiFetch("/api/referral/config")
    if (!data) return
    if (Array.isArray(data)) setConfigs(data)
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const loadConfig = (cfg: any) => {
    setSelectedConfig({
      ...cfg,
      _id: String(cfg._id)
    })

    setName(cfg.name || "")
    setLevels(cfg.levels)
    setPercentages([...cfg.percentages])
    setCommissionType(cfg.commissionType)
    setDistribution(cfg.distributionPercentage ?? 100)
    setMaxCap(cfg.maxCommissionPerSale || "")
  }

  const handleLevelChange = (value: number) => {
    setLevels(value)
    const updated = Array.from(
      { length: value },
      (_, i) => percentages[i] || 0
    )
    setPercentages(updated)
  }

  const updatePercentage = (index: number, value: number) => {
    const updated = [...percentages]
    updated[index] = value
    setPercentages(updated)
  }

  const saveConfig = async () => {

    if (!name.trim()) {
      alert("Config name required")
      return
    }

    if (percentages.reduce((a, b) => a + b, 0) > 100) {
      alert("Total percentage cannot exceed 100")
      return
    }

    setLoading(true)

    const endpoint = selectedConfig?._id
      ? `/api/referral/config/${selectedConfig._id}`
      : "/api/referral/config"

    const method = selectedConfig?._id ? "PUT" : "POST"

    const data = await apiFetch(endpoint, {
      method,
      body: JSON.stringify({
        name: name.trim(),
        levels,
        percentages,
        distributionPercentage: distribution,
        commissionType,
        maxCommissionPerSale: maxCap || undefined
      })
    })

    if (!data) {
      alert("Error saving config")
      setLoading(false)
      return
    }

    alert(selectedConfig ? "Updated" : "Created")

    resetForm()
    await fetchConfigs()
    setLoading(false)
  }

  const deleteConfig = async (id: string) => {
    if (!confirm("Delete this config?")) return

    await apiFetch(`/api/referral/config/${id}`, {
      method: "DELETE"
    })

    await fetchConfigs()
  }

  const activateConfig = async (id: string) => {
    await apiFetch("/api/referral/config/activate", {
      method: "POST",
      body: JSON.stringify({ configId: id })
    })

    await fetchConfigs()
  }

  const resetForm = () => {
    setSelectedConfig(null)
    setName("")
    setLevels(1)
    setPercentages([0])
    setCommissionType("percentage")
    setDistribution(100)
    setMaxCap("")
  }

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Network size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Referral engine</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Referral Configurations
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Define commission levels, distribution rules, and active payout configuration.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 font-semibold text-slate-950">All Configs</h2>

          {configs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No referral configs yet
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map(cfg => (
                <div
                  key={cfg._id}
                  className={`rounded-lg border p-4 ${
                    cfg.isActive
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        cfg.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {cfg.isActive && <CheckCircle2 size={14} />}
                        {cfg.isActive ? "Active" : "Inactive"}
                      </p>
                      <p className="mt-3 font-semibold text-slate-950">{cfg.name}</p>
                      <p className="mt-1 text-sm text-slate-600">Levels: {cfg.levels}</p>
                      <p className="text-sm text-slate-600">{cfg.percentages.join(" %, ")} %</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => loadConfig(cfg)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      {!cfg.isActive && (
                        <button
                          onClick={() => activateConfig(cfg._id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={15} />
                          Activate
                        </button>
                      )}

                      <button
                        onClick={() => deleteConfig(cfg._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-950">
              {selectedConfig ? "Edit Config" : "Create Config"}
            </h2>
            {selectedConfig && (
              <button
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <input
              placeholder="Config Name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              min={1}
              value={levels}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
              className={inputClass}
            />

            {percentages.map((p, i) => (
              <input
                key={i}
                type="number"
                placeholder={`Level ${i + 1}`}
                value={p}
                onChange={(e) => updatePercentage(i, Number(e.target.value))}
                className={inputClass}
              />
            ))}

            <input
              type="number"
              value={distribution}
              onChange={(e) => setDistribution(Number(e.target.value))}
              className={inputClass}
              placeholder="Distribution %"
            />

            <select
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value)}
              className={inputClass}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>

            <input
              type="number"
              placeholder="Max cap"
              value={maxCap}
              onChange={(e) =>
                setMaxCap(e.target.value ? Number(e.target.value) : "")
              }
              className={inputClass}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={saveConfig}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                {loading ? "Saving..." : selectedConfig ? "Update" : "Create"}
              </button>

              {selectedConfig && (
                <button
                  onClick={resetForm}
                  className="rounded-lg bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
