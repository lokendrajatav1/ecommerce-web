import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// POST - Add to cart
export async function POST(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId
      const { productId, quantity } = await req.json()

      if (!productId || !quantity || quantity < 1) {
        return NextResponse.json({ success: false, error: "Invalid product or quantity" } as ApiResponse, {
          status: 400,
        })
      }

      // Get or create cart
      let cart = await prisma.cart.findUnique({ where: { userId } })
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId } })
      }

      // Verify product exists and has stock
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ success: false, error: "Product not found" } as ApiResponse, { status: 404 })
      }

      if (product.stock < quantity) {
        return NextResponse.json({ success: false, error: "Insufficient stock" } as ApiResponse, { status: 400 })
      }

      // Add or update cart item
      const cartItem = await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        update: { quantity: { increment: quantity } },
        create: { cartId: cart.id, productId, quantity },
        include: { product: { include: { images: true } } },
      })

      return NextResponse.json({ success: true, data: cartItem } as ApiResponse, { status: 201 })
    } catch (error) {
      console.error("Add to cart error:", error)
      return NextResponse.json({ success: false, error: "Failed to add to cart" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId
      const { productId, quantity } = await req.json()

      if (!productId || quantity === undefined) {
        return NextResponse.json({ success: false, error: "Product ID and quantity required" } as ApiResponse, {
          status: 400,
        })
      }

      // Get user's cart
      const cart = await prisma.cart.findUnique({ where: { userId } })
      if (!cart) {
        return NextResponse.json({ success: false, error: "Cart not found" } as ApiResponse, { status: 404 })
      }

      // Verify product has stock if quantity is increasing
      if (quantity > 0) {
        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (!product || product.stock < quantity) {
          return NextResponse.json({ success: false, error: "Insufficient stock" } as ApiResponse, { status: 400 })
        }
      }

      if (quantity === 0) {
        // Delete item
        await prisma.cartItem.delete({
          where: { cartId_productId: { cartId: cart.id, productId } },
        })
        return NextResponse.json({ success: true, data: { message: "Item removed from cart" } } as ApiResponse)
      }

      const cartItem = await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity },
        include: { product: { include: { images: true } } },
      })

      return NextResponse.json({ success: true, data: cartItem } as ApiResponse)
    } catch (error: any) {
      if (error.code === "P2025") {
        return NextResponse.json({ success: false, error: "Cart item not found" } as ApiResponse, { status: 404 })
      }
      console.error("Update cart error:", error)
      return NextResponse.json({ success: false, error: "Failed to update cart" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
