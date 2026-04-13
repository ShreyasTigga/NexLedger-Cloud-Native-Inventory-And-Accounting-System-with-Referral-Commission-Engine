import jwt from "jsonwebtoken"

const ACCESS_SECRET = process.env.JWT_SECRET as string
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined in environment variables")
}

// ================= ACCESS TOKEN =================
export function signAccessToken(payload: any) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "15m"
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET)
}

// ================= REFRESH TOKEN =================
export function signRefreshToken(payload: any) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "7d"
  })
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET)
}