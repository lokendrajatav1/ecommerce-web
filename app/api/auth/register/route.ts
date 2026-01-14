import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateAccessToken, generateRefreshToken, hashAndStoreRefreshToken } from "@/lib/auth"
import type { ApiResponse, AuthResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" } as ApiResponse, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" } as ApiResponse, {
        status: 400,
      })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already registered" } as ApiResponse, { status: 409 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    })

    // Create cart for customer
    await prisma.cart.create({ data: { userId: user.id } })

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
      status: 201,
      headers: { "Set-Cookie": `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict` },
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" } as ApiResponse, { status: 500 })
  }
}
