import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - Get user's orders
export async function GET(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId

      const orders = await prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({ success: true, data: orders } as ApiResponse)
    } catch (error) {
      console.error("Get orders error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch orders" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// POST - Create order from cart
export async function POST(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId

      // Get cart with items
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      })

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ success: false, error: "Cart is empty" } as ApiResponse, { status: 400 })
      }

      // Verify all products have sufficient stock
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for ${item.product.name}` } as ApiResponse,
            { status: 400 },
          )
        }
      }

      // Calculate total
      const total = cart.items.reduce((sum:number, item) => sum + item.product.price * item.quantity, 0)

      // Create order in transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId,
            total,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
          include: { items: { include: { product: true } } },
        })

        // Reduce stock for each product
        for (const item of cart.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        // Clear cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

        return newOrder
      })

      return NextResponse.json({ success: true, data: order } as ApiResponse, { status: 201 })
    } catch (error) {
      console.error("Create order error:", error)
      return NextResponse.json({ success: false, error: "Failed to create order" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
