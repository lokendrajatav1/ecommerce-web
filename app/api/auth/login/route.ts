import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, generateAccessToken, generateRefreshToken, hashAndStoreRefreshToken } from "@/lib/auth"
import type { ApiResponse, AuthResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" } as ApiResponse, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" } as ApiResponse, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" } as ApiResponse, { status: 401 })
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)
    await hashAndStoreRefreshToken(user.id, refreshToken)

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    }

    return NextResponse.json(response, {
      status: 200,
      headers: { "Set-Cookie": `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict` },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" } as ApiResponse, { status: 500 })
  }
}
