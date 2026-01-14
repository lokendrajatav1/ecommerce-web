import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - Admin only: List all orders
export async function GET(request: NextRequest) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const orders = await prisma.order.findMany({
        include: { items: { include: { product: true } }, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({ success: true, data: orders } as ApiResponse)
    } catch (error) {
      console.error("Admin get orders error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch orders" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
