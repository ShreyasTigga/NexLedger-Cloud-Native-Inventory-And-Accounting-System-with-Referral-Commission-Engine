import { verifyAccessToken } from "./jwt"

export function getUserFromRequest(req: any) {
  const token = req.cookies.get("accessToken")?.value

  if (!token) return null

  try {
    return verifyAccessToken(token)
  } catch {
    return null
  }
}