import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withAdminAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - Get order details (customer or admin)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params
      const userId = req.auth!.userId
      const isAdmin = req.auth!.role === "ADMIN"

      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } }, user: { select: { email: true, name: true } } },
      })

      if (!order) {
        return NextResponse.json({ success: false, error: "Order not found" } as ApiResponse, { status: 404 })
      }

      // Customers can only view their own orders
      if (!isAdmin && order.userId !== userId) {
        return NextResponse.json({ success: false, error: "Forbidden" } as ApiResponse, { status: 403 })
      }

      return NextResponse.json({ success: true, data: order } as ApiResponse)
    } catch (error) {
      console.error("Get order error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch order" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// PUT - Update order status (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params
      const { status } = await req.json()

      if (!status) {
        return NextResponse.json({ success: false, error: "Status required" } as ApiResponse, { status: 400 })
      }

      const validStatuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, error: "Invalid status" } as ApiResponse, { status: 400 })
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: { items: { include: { product: true } } },
      })

      return NextResponse.json({ success: true, data: order } as ApiResponse)
    } catch (error: any) {
      if (error.code === "P2025") {
        return NextResponse.json({ success: false, error: "Order not found" } as ApiResponse, { status: 404 })
      }
      console.error("Update order error:", error)
      return NextResponse.json({ success: false, error: "Failed to update order" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
