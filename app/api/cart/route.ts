import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - Get user's cart
export async function GET(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId

      let cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: { include: { images: true } } } } },
      })

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
          include: { items: { include: { product: { include: { images: true } } } } },
        })
      }

      // Calculate total
      const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

      return NextResponse.json({ success: true, data: { ...cart, total } } as ApiResponse)
    } catch (error) {
      console.error("Get cart error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch cart" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
