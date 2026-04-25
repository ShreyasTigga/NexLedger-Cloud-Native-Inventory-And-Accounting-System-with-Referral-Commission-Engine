import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function getUserFromRequest(req: NextRequest) {
  try {
    const retailerToken = req.cookies.get("retailerToken")?.value
    const customerToken = req.cookies.get("customerToken")?.value

    let token: string | undefined
    let tokenType: "retailer" | "customer" | null = null

    if (retailerToken) {
      token = retailerToken
      tokenType = "retailer"
    } else if (customerToken) {
      token = customerToken
      tokenType = "customer"
    }

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

    return {
      ...decoded,
      tokenType
    }

  } catch (err) {
    console.log("❌ Token error:", err)
    return null
  }
}