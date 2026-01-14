import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// GET - Admin only: List categories
export async function GET(request: NextRequest) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
      })

      return NextResponse.json({ success: true, data: categories } as ApiResponse)
    } catch (error) {
      console.error("Get categories error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch categories" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// POST - Admin only: Create category
export async function POST(request: NextRequest) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const { name } = await req.json()

      if (!name) {
        return NextResponse.json({ success: false, error: "Category name required" } as ApiResponse, { status: 400 })
      }

      const slug = name.toLowerCase().replace(/\s+/g, "-")

      const category = await prisma.category.create({
        data: { name, slug },
      })

      return NextResponse.json({ success: true, data: category } as ApiResponse, { status: 201 })
    } catch (error: any) {
      if (error.code === "P2002") {
        return NextResponse.json({ success: false, error: "Category already exists" } as ApiResponse, { status: 409 })
      }
      console.error("Create category error:", error)
      return NextResponse.json({ success: false, error: "Failed to create category" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
