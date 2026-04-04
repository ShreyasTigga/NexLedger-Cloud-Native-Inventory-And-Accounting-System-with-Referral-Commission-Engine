import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  const { pathname } = req.nextUrl

  const publicRoutes = [
    "/customer/login",
    "/customer/register"
  ]

  // 🔥 Block login if already logged in
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(
      new URL("/customer/dashboard", req.url)
    )
  }

  const isProtected =
    pathname.startsWith("/customer") ||
    pathname.startsWith("/retailer")

  if (isProtected) {
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(
        new URL("/customer/login", req.url)
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/retailer/:path*"
  ]
}