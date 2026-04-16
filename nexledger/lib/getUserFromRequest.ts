import { verifyAccessToken } from "./jwt"

export interface TokenPayload {
  userId: string
  role: "retailer" | "customer"
}

export function getUserFromRequest(req: any): TokenPayload | null {
  const token = req.cookies.get("accessToken")?.value

  if (!token) return null

  try {
    return verifyAccessToken(token) as TokenPayload // ✅ FIX
  } catch {
    return null
  }
}