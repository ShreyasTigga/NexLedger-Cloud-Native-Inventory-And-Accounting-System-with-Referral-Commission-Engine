import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get("accessToken")?.value

  // ================= PUBLIC ROUTES =================
  const isPublicRoute =
    pathname.startsWith("/retailer/login") ||
    pathname.startsWith("/retailer/register") ||
    pathname.startsWith("/customer-auth/login") ||
    pathname.startsWith("/customer-auth/register") ||
    pathname.startsWith("/api/auth")

  // ================= NO TOKEN =================
  if (!token) {
    if (!isPublicRoute) {
      if (pathname.startsWith("/customer")) {
        return NextResponse.redirect(
          new URL("/customer-auth/login", req.url)
        )
      }

      if (pathname.startsWith("/retailer")) {
        return NextResponse.redirect(
          new URL("/retailer/login", req.url)
        )
      }
    }

    return NextResponse.next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string
    }

    // ================= BLOCK AUTH PAGES IF LOGGED IN =================
    if (pathname.startsWith("/customer-auth")) {
      if (decoded.role === "customer") {
        return NextResponse.redirect(
          new URL("/customer/shop", req.url)
        )
      }
    }

    if (pathname.startsWith("/retailer/login")) {
      if (decoded.role === "retailer") {
        return NextResponse.redirect(
          new URL("/retailer/dashboard", req.url)
        )
      }
    }

    // ================= ROLE-BASED PROTECTION =================

    if (pathname.startsWith("/customer")) {
      if (decoded.role !== "customer") {
        return NextResponse.redirect(
          new URL("/customer-auth/login", req.url)
        )
      }
    }

    if (pathname.startsWith("/retailer")) {
      if (decoded.role !== "retailer") {
        return NextResponse.redirect(
          new URL("/retailer/login", req.url)
        )
      }
    }

    return NextResponse.next()

  } catch {
    // invalid token
    if (pathname.startsWith("/customer")) {
      return NextResponse.redirect(
        new URL("/customer-auth/login", req.url)
      )
    }

    return NextResponse.redirect(
      new URL("/retailer/login", req.url)
    )
  }
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/customer-auth/:path*",
    "/retailer/:path*"
  ]
}