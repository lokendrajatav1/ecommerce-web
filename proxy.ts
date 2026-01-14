import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { verifyRefreshToken } from "./lib/auth"

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Set security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const accessToken = request.cookies.get("accessToken")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (accessToken) {
      // verify access token
      try {
        jwt.verify(accessToken, process.env.JWT_SECRET!)
        return response
      } catch (e) {
        // fallthrough to try refresh token
      }
    }

    // Try refresh token cookie to allow server-side page access when access token is stored only in localStorage
    const refreshToken = request.cookies.get("refreshToken")?.value
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }
        const userId = decoded.userId
        const ok = await verifyRefreshToken(userId, refreshToken)
        if (ok) return response
      } catch (e) {
        // invalid refresh token
      }
    }

    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/:path*"],
}
