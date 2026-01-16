import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { verifyPassword, hashPassword } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

// GET - return current user's profile
export async function GET(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, createdAt: true } })
      if (!user) return NextResponse.json({ success: false, error: "User not found" } as ApiResponse, { status: 404 })
      return NextResponse.json({ success: true, data: user } as ApiResponse)
    } catch (error) {
      console.error("Get profile error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch profile" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// PUT - update profile (name/email) or change password
export async function PUT(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId
      const { name, email, currentPassword, newPassword } = await req.json()

      const updates: any = {}
      if (name) updates.name = name
      if (email) {
        // ensure email not used
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing && existing.id !== userId) {
          return NextResponse.json({ success: false, error: "Email already in use" } as ApiResponse, { status: 409 })
        }
        updates.email = email
      }

      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json({ success: false, error: "Current password required to change password" } as ApiResponse, { status: 400 })
        }
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ success: false, error: "User not found" } as ApiResponse, { status: 404 })
        const valid = await verifyPassword(currentPassword, user.password)
        if (!valid) return NextResponse.json({ success: false, error: "Invalid current password" } as ApiResponse, { status: 401 })
        updates.password = await hashPassword(newPassword)
      }

      const updated = await prisma.user.update({ where: { id: userId }, data: updates, select: { id: true, email: true, name: true, role: true } })
      return NextResponse.json({ success: true, data: updated } as ApiResponse)
    } catch (error) {
      console.error("Update profile error:", error)
      return NextResponse.json({ success: false, error: "Failed to update profile" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
