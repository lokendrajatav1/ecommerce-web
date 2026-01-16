import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - list user's wishlist
export async function GET(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId
      const items = await prisma.wishlistItem.findMany({
        where: { userId },
        include: { product: { include: { images: true, category: true } } },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({ success: true, data: items } as ApiResponse)
    } catch (error) {
      console.error("Get wishlist error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch wishlist" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// POST - add product to wishlist
export async function POST(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId
      const { productId } = await req.json()
      if (!productId) {
        return NextResponse.json({ success: false, error: "productId required" } as ApiResponse, { status: 400 })
      }

      // verify product exists
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ success: false, error: "Product not found" } as ApiResponse, { status: 404 })
      }

      const created = await prisma.wishlistItem.create({ data: { userId, productId }, include: { product: { include: { images: true } } } })
      return NextResponse.json({ success: true, data: created } as ApiResponse, { status: 201 })
    } catch (error: any) {
      if (error?.code === "P2002") {
        return NextResponse.json({ success: false, error: "Already in wishlist" } as ApiResponse, { status: 409 })
      }
      console.error("Add to wishlist error:", error)
      return NextResponse.json({ success: false, error: "Failed to add to wishlist" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// DELETE - remove item from wishlist (query param or body { productId })
export async function DELETE(request: NextRequest) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.auth!.userId
      const url = new URL(request.url)
      const qProductId = url.searchParams.get("productId")
      let productId = qProductId

      if (!productId) {
        try {
          const body = await req.json()
          productId = body.productId
        } catch {
          // ignore
        }
      }

      if (!productId) {
        return NextResponse.json({ success: false, error: "productId required" } as ApiResponse, { status: 400 })
      }

      await prisma.wishlistItem.deleteMany({ where: { userId, productId } })
      return NextResponse.json({ success: true } as ApiResponse)
    } catch (error) {
      console.error("Remove wishlist error:", error)
      return NextResponse.json({ success: false, error: "Failed to remove item" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
