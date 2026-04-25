"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
  const [stateName, setStateName] = useState("") // ✅ FIXED
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
        credentials: "include", // ✅ IMPORTANT
        body: JSON.stringify({
          businessName, // ✅ FIXED
          ownerName,
          email,
          phone,
          password,
          gstin,
          pan,
          address: {
            line1,
            city,
            state: stateName, // ✅ FIXED
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
    <div className="max-w-md mx-auto p-6 space-y-4">

      <h1 className="text-xl font-semibold text-center">
        Retailer Registration
      </h1>

      {referralCode ? (
        <div className="bg-green-100 p-4 rounded text-center space-y-2">
          <p className="font-medium">Registration Successful 🎉</p>
          <p>Your Referral Code:</p>
          <p className="text-xl font-bold text-green-700">{referralCode}</p>

          <button
            onClick={() => router.push("/retailer/login")}
            className="text-blue-600 underline"
          >
            Go to Login →
          </button>
        </div>
      ) : (
        <>
          <input placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="border p-2 w-full rounded" />
          <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="border p-2 w-full rounded" />

          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full rounded" />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-2 w-full rounded" />

          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 w-full rounded" />

          <input placeholder="Address Line" value={line1} onChange={(e) => setLine1(e.target.value)} className="border p-2 w-full rounded" />
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="border p-2 w-full rounded" />
          <input placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} className="border p-2 w-full rounded" />
          <input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="border p-2 w-full rounded" />

          <input placeholder="GSTIN (optional)" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className="border p-2 w-full rounded" />
          <input placeholder="PAN (optional)" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} className="border p-2 w-full rounded" />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="bg-blue-600 text-white w-full py-2 rounded"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </>
      )}

    </div>
  )
}