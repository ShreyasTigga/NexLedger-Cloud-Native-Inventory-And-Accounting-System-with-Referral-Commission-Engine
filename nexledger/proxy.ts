import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get("accessToken")?.value

  // ================= PUBLIC ROUTES =================
  const isPublicRoute =
    pathname.startsWith("/retailer-auth/login") ||
    pathname.startsWith("/retailer-auth/register") ||
    pathname.startsWith("/customer-auth/login") ||
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
          new URL("/retailer-auth/login", req.url)
        )
      }
    }

    return NextResponse.next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string
    }

    // ================= BLOCK AUTH PAGES =================

    // Customer trying auth pages
    if (pathname.startsWith("/customer-auth")) {
      if (decoded.role === "customer") {
        return NextResponse.redirect(
          new URL("/customer/dashboard", req.url)
        )
      }

      // retailer trying customer auth
      if (decoded.role === "retailer") {
        return NextResponse.redirect(
          new URL("/retailer/dashboard", req.url)
        )
      }
    }

    // Retailer trying auth pages
    if (pathname.startsWith("/retailer-auth")) {
      if (decoded.role === "retailer") {
        return NextResponse.redirect(
          new URL("/retailer/dashboard", req.url)
        )
      }

      // customer trying retailer auth
      if (decoded.role === "customer") {
        return NextResponse.redirect(
          new URL("/customer/dashboard", req.url)
        )
      }
    }

    // ================= ROLE PROTECTION =================

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
          new URL("/retailer-auth/login", req.url)
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
      new URL("/retailer-auth/login", req.url)
    )
  }
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/customer-auth/:path*",
    "/retailer/:path*",
    "/retailer-auth/:path*"
  ]
}