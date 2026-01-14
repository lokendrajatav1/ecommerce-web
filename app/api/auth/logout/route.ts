import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (refreshToken) {
      // Delete refresh token from database
      let userId: string
      try {
        const decoded = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64").toString())
        userId = decoded.userId
        await prisma.refreshToken.deleteMany({ where: { userId } })
      } catch {
        // Invalid token format, continue with logout
      }
    }

    const response = NextResponse.json({ success: true, data: { message: "Logged out successfully" } } as ApiResponse, {
      status: 200,
    })

    // Clear refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" } as ApiResponse, { status: 500 })
  }
}
