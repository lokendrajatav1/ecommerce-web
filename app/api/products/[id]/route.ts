
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - Public: Get single product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true, category: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" } as ApiResponse, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product } as ApiResponse)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch product" } as ApiResponse, { status: 500 })
  }
}

// PUT - Admin only: Update product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params
      const { name, description, price, stock, categoryId, images } = await req.json()

      // Verify product exists
      const existingProduct = await prisma.product.findUnique({ where: { id } })
      if (!existingProduct) {
        return NextResponse.json({ success: false, error: "Product not found" } as ApiResponse, { status: 404 })
      }

      if (price && price <= 0) {
        return NextResponse.json({ success: false, error: "Price must be positive" } as ApiResponse, { status: 400 })
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(price && { price }),
          ...(stock !== undefined && { stock }),
          ...(categoryId && { categoryId }),
        },
        include: { images: true, category: true },
      })

      // If images array was provided, replace existing images
      if (images && Array.isArray(images)) {
        // remove existing images for the product
        await prisma.productImage.deleteMany({ where: { productId: id } })
        if (images.length > 0) {
          // create new image records
          await prisma.productImage.createMany({
            data: images.map((url: string) => ({ url, productId: id })),
          })
        }

        // reload product with images
        const refreshed = await prisma.product.findUnique({
          where: { id },
          include: { images: true, category: true },
        })
        return NextResponse.json({ success: true, data: refreshed } as ApiResponse)
      }

      return NextResponse.json({ success: true, data: product } as ApiResponse)
    } catch (error) {
      console.error("Update product error:", error)
      return NextResponse.json({ success: false, error: "Failed to update product" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// DELETE - Admin only: Delete product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params
      // Prevent deleting products that appear in completed orders to preserve order history
      const orderItemCount = await prisma.orderItem.count({ where: { productId: id } })
      if (orderItemCount > 0) {
        return NextResponse.json({ success: false, error: "Product has been ordered and cannot be deleted" } as ApiResponse, { status: 409 })
      }

      // Clean up ephemeral references (cart items, images) before deleting product
      await prisma.cartItem.deleteMany({ where: { productId: id } })
      await prisma.productImage.deleteMany({ where: { productId: id } })

      const product = await prisma.product.delete({ where: { id } })

      return NextResponse.json({ success: true, data: product } as ApiResponse)
    } catch (error: any) {
      if (error?.code === "P2025") {
        return NextResponse.json({ success: false, error: "Product not found" } as ApiResponse, { status: 404 })
      }
      if (error?.code === "P2003") {
        // Foreign key constraint (should be rare due to above checks)
        return NextResponse.json({ success: false, error: "Cannot delete product due to related data" } as ApiResponse, { status: 409 })
      }
      console.error("Delete product error:", error && (error.stack || error))
      return NextResponse.json({ success: false, error: "Failed to delete product" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
