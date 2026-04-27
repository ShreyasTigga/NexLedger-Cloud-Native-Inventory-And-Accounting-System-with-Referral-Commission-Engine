import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function getUserFromRequest(req: NextRequest) {
  try {
    // 🔐 GET TOKEN FROM COOKIE (UPDATED)
    const token = req.cookies.get("accessToken")?.value

    if (!token) {
      console.log("❌ No access token")
      return null
    }

    // 🔐 VERIFY TOKEN
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string
      role: string
      customerId?: string
      retailerId?: string
    }

    // 🔐 SAFETY CHECK
    if (!decoded?.userId || !decoded?.role) {
      console.log("❌ Invalid token payload")
      return null
    }

    return decoded

  } catch (err) {
    console.log("❌ Token error:", err)
    return null
  }
}