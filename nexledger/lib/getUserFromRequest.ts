// lib/getUserFromRequest.ts

import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function getUserFromRequest(req: Request) {
  try {
    let token: string | undefined

    // ✅ FIRST: Try Next.js cookies()
    try {
      const cookieStore = await cookies()
      token = cookieStore.get("accessToken")?.value
    } catch {
      // ignore
    }

    // ✅ FALLBACK: Try headers
    if (!token) {
      const cookieHeader = req.headers.get("cookie")

      if (cookieHeader) {
        const parsed = Object.fromEntries(
          cookieHeader.split("; ").map(c => {
            const [key, ...v] = c.split("=")
            return [key, v.join("=")]
          })
        )

        token = parsed["accessToken"]
      }
    }

    if (!token) {
      console.log("❌ No token found")
      return null
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    )

    return decoded as {
      userId: string
      role: string
      customerId?: string
      retailerId?: string
    }

  } catch (err) {
    console.log("❌ Token error:", err)
    return null
  }
}