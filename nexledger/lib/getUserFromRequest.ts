// lib/getUserFromRequest.ts

import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function getUserFromRequest(req: NextRequest) {
  try {
    // ✅ ALWAYS use request cookies
    const token =
      req.cookies.get("retailerToken")?.value ||
      req.cookies.get("customerToken")?.value

    if (!token) {
      console.log("❌ No token found")
      return null
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string
      role: string
      customerId?: string
      retailerId?: string
    }

    return decoded

  } catch (err) {
    console.log("❌ Token error:", err)
    return null
  }
}