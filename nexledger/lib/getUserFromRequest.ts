import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function getUserFromRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")

    // 🔐 Check header
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ No Bearer token")
      return null
    }

    // 🔐 Extract token safely
    const token = authHeader.split(" ")[1]

    if (!token) {
      console.log("❌ Empty token")
      return null
    }

    // 🔐 Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string
      role: string
      customerId?: string
      retailerId?: string
    }

    // 🔐 Safety check
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