import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - Public endpoint to list products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const skip = Number.parseInt(searchParams.get("skip") || "0")
    const take = Number.parseInt(searchParams.get("take") || "20")

    const where = categoryId ? { categoryId } : {}

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true, category: true },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { products, total } } as ApiResponse)
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch products" } as ApiResponse, { status: 500 })
  }
}

// POST - Admin only: Create product
export async function POST(request: NextRequest) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const { name, description, price, stock, categoryId, images } = await req.json()

      if (!name || !price || !categoryId) {
        return NextResponse.json({ success: false, error: "Missing required fields" } as ApiResponse, { status: 400 })
      }

      if (price <= 0) {
        return NextResponse.json({ success: false, error: "Price must be positive" } as ApiResponse, { status: 400 })
      }

      // Verify category exists
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        return NextResponse.json({ success: false, error: "Category not found" } as ApiResponse, { status: 404 })
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock: stock || 0,
          categoryId,
          images: {
            create: (images || []).map((url: string) => ({ url })),
          },
        },
        include: { images: true, category: true },
      })

      return NextResponse.json({ success: true, data: product } as ApiResponse, { status: 201 })
    } catch (error) {
      console.error("Create product error:", error)
      return NextResponse.json({ success: false, error: "Failed to create product" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
