import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: "Refresh token not found" } as ApiResponse, { status: 401 })
    }

    // Extract userId from refresh token (without full verification first)
    let userId: string
    try {
      const decoded = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64").toString())
      userId = decoded.userId
    } catch {
      return NextResponse.json({ success: false, error: "Invalid refresh token" } as ApiResponse, { status: 401 })
    }

    // Verify refresh token
    const isValid = await verifyRefreshToken(userId, refreshToken)
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid or expired refresh token" } as ApiResponse, {
        status: 401,
      })
    }

    // Get user and generate new access token
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" } as ApiResponse, { status: 404 })
    }

    const accessToken = generateAccessToken(user.id, user.role)

    return NextResponse.json({ success: true, data: { accessToken } } as ApiResponse, { status: 200 })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" } as ApiResponse, { status: 500 })
  }
}
