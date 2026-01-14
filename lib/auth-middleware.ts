import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "./auth"
import type { AuthPayload } from "./types"

export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthPayload
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: AuthenticatedRequest) => {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const auth = verifyAccessToken(token)
    if (!auth) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    request.auth = auth
    return handler(request)
  }
}

export function withAdminAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: AuthenticatedRequest) => {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const auth = verifyAccessToken(token)
    if (!auth) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    if (auth.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 })
    }

    request.auth = auth
    return handler(request)
  }
}
