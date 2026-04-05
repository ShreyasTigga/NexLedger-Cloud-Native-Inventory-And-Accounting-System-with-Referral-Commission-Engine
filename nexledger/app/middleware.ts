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

  // ================= BLOCK LOGIN IF LOGGED IN =================
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(
      new URL("/customer/dashboard", req.url)
    )
  }

  // ================= PROTECTED =================
  const isCustomerRoute = pathname.startsWith("/customer")
  const isRetailerRoute = pathname.startsWith("/retailer")

  if (isCustomerRoute || isRetailerRoute) {

    if (!token) {
      return NextResponse.redirect(
        new URL("/customer/login", req.url)
      )
    }

    const decoded: any = verifyToken(token)

    if (!decoded) {
      return NextResponse.redirect(
        new URL("/customer/login", req.url)
      )
    }

    // ================= ROLE CHECK =================

    // Customer trying retailer routes ❌
    if (isRetailerRoute && decoded.role !== "retailer") {
      return NextResponse.redirect(
        new URL("/customer/dashboard", req.url)
      )
    }

    // Retailer trying customer routes ❌ (optional rule)
    if (isCustomerRoute && decoded.role !== "customer") {
      return NextResponse.redirect(
        new URL("/retailer/dashboard", req.url)
      )
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/retailer/:path*"
  ]
}