import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 🔐 GET TOKEN FROM COOKIE
  const token = req.cookies.get("accessToken")?.value

  // ================= PUBLIC ROUTES =================
  const isPublicRoute =
    pathname.startsWith("/retailer/login") ||
     pathname.startsWith("/retailer/register") ||
    pathname.startsWith("/customer/login") ||
    pathname.startsWith("/customer/register") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // ================= NO TOKEN =================
  if (!token) {
    if (pathname.startsWith("/customer")) {
      return NextResponse.redirect(new URL("/customer/login", req.url))
    }

    return NextResponse.redirect(new URL("/retailer/login", req.url))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string
    }

    // ================= ROLE-BASED ROUTING =================

    if (pathname.startsWith("/retailer")) {
      if (decoded.role !== "retailer") {
        return NextResponse.redirect(new URL("/retailer/login", req.url))
      }
    }

    if (pathname.startsWith("/customer")) {
      if (decoded.role !== "customer") {
        return NextResponse.redirect(new URL("/customer/login", req.url))
      }
    }

    return NextResponse.next()

  } catch (err) {
    if (pathname.startsWith("/customer")) {
      return NextResponse.redirect(new URL("/customer/login", req.url))
    }

    return NextResponse.redirect(new URL("/retailer/login", req.url))
  }
}

export const config = {
  matcher: [
    "/retailer/:path*",
    "/customer/:path*"
  ]
}