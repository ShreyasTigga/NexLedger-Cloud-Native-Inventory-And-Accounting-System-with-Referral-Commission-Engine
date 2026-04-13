import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value
  const { pathname } = req.nextUrl

  // ================= PUBLIC ROUTES =================
  const publicRoutes = [
    "/customer/login",
    "/customer/register",
    "/retailer/login",
    "/retailer/register"
  ]

  // ================= BLOCK LOGIN IF ALREADY LOGGED IN =================
  if (token && publicRoutes.includes(pathname)) {
    try {
      const decoded: any = verifyAccessToken(token)

      if (decoded?.role === "retailer") {
        return NextResponse.redirect(
          new URL("/retailer/dashboard", req.url)
        )
      }

      if (decoded?.role === "customer") {
        return NextResponse.redirect(
          new URL("/customer/dashboard", req.url)
        )
      }
    } catch {
      // invalid token → allow access to login
    }
  }

  // ================= ROUTE TYPES =================
  const isCustomerRoute = pathname.startsWith("/customer")
  const isRetailerRoute = pathname.startsWith("/retailer")

  if (isCustomerRoute || isRetailerRoute) {

    // 🔐 No token → redirect to correct login
    if (!token) {
      return NextResponse.redirect(
        new URL(
          isRetailerRoute ? "/retailer/login" : "/customer/login",
          req.url
        )
      )
    }

    let decoded: any = null

    try {
      decoded = verifyAccessToken(token)
    } catch {
      return NextResponse.redirect(
        new URL("/customer/login", req.url)
      )
    }

    // ================= RBAC =================

    // ❌ Customer accessing retailer routes
    if (isRetailerRoute && decoded.role !== "retailer") {
      return NextResponse.redirect(
        new URL("/customer/dashboard", req.url)
      )
    }

    // ❌ Retailer accessing customer routes
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