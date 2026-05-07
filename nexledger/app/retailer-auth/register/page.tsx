"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
  Store,
  UserRound
} from "lucide-react"

export default function RetailerRegisterPage() {
  const router = useRouter()

  // ================= STATE =================
  const [businessName, setBusinessName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  const [line1, setLine1] = useState("")
  const [city, setCity] = useState("")
  const [stateName, setStateName] = useState("")
  const [pincode, setPincode] = useState("")

  const [gstin, setGstin] = useState("")
  const [pan, setPan] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState("")

  // ================= VALIDATION =================
  function validateForm() {
    if (!businessName.trim() || businessName.length < 2) {
      setError("Business name is required")
      return false
    }

    if (!ownerName.trim() || ownerName.length < 2) {
      setError("Owner name is required")
      return false
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Valid email is required")
      return false
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      setError("Valid phone number required")
      return false
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }

    if (!line1.trim() || !city.trim() || !stateName.trim() || !pincode) {
      setError("Complete address is required")
      return false
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setError("Invalid pincode")
      return false
    }

    if (
      gstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)
    ) {
      setError("Invalid GSTIN")
      return false
    }

    if (
      pan &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
    ) {
      setError("Invalid PAN")
      return false
    }

    return true
  }

  // ================= REGISTER =================
  async function handleRegister() {
    setError("")

    if (!validateForm()) return

    try {
      setLoading(true)

      const res = await fetch("/api/retailer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          businessName,
          ownerName,
          email,
          phone,
          password,
          gstin,
          pan,
          address: {
            line1,
            city,
            state: stateName,
            pincode
          }
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }

      setReferralCode(data.referralCode)

    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden h-full min-h-[680px] rounded-lg bg-slate-950 p-10 text-white shadow-xl shadow-slate-200/70 lg:flex lg:flex-col lg:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/15"
          >
            <ArrowLeft size={16} />
            Home
          </Link>

          <div className="space-y-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <Store size={26} />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-300">
                New Retailer Setup
              </p>
              <h1 className="max-w-md text-4xl font-semibold leading-tight">
                Create your store profile and start managing NexLedger.
              </h1>
              <p className="mt-3 max-w-md leading-7 text-slate-300">
                Add business details, owner contact, address, and tax identity
                in one clean registration flow.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <Building2 size={19} className="text-blue-300" />
                <span className="text-sm text-slate-200">
                  Business information
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <ShieldCheck size={19} className="text-blue-300" />
                <span className="text-sm text-slate-200">
                  Tax and account setup
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400">NexLedger</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950 lg:hidden"
          >
            <ArrowLeft size={16} />
            Home
          </Link>

          <div className="mx-auto max-w-3xl space-y-6">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Building2 size={23} />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Retailer Registration
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete your retailer profile to create your NexLedger account.
              </p>
            </div>

            {referralCode ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                <CheckCircle2 className="mx-auto text-green-700" size={42} />
                <p className="mt-4 text-lg font-semibold text-green-900">
                  Registration Successful
                </p>
                <p className="mt-2 text-sm text-green-700">
                  Your Referral Code:
                </p>
                <p className="mt-2 rounded-lg bg-white px-4 py-3 text-2xl font-bold tracking-wide text-green-700">
                  {referralCode}
                </p>

                <button
                  onClick={() => router.push("/retailer/login")}
                  className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Building2 size={18} className="text-blue-600" />
                    Business Details
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2" />
                  </div>
                </div>

                <div className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin size={18} className="text-blue-600" />
                    Store Address
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input placeholder="Address Line" value={line1} onChange={(e) => setLine1(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2" />
                    <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    <input placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    <input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2" />
                  </div>
                </div>

                <div className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UserRound size={18} className="text-blue-600" />
                    Tax Details
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input placeholder="GSTIN (optional)" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    <input placeholder="PAN (optional)" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Registering..." : "Register"}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
