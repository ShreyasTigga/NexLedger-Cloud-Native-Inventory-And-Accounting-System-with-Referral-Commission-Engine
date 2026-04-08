import { NextRequest } from "next/server"
import { verifyToken } from "./jwt"

export function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value

  if (!token) return null

  const decoded: any = verifyToken(token)

  return decoded
}