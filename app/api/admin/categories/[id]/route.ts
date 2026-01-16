import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import type { ApiResponse } from "@/lib/types"

// PUT - Admin only: Update category
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params

      if (!id) {
        console.error("Update category: missing id in params", { params })
        return NextResponse.json({ success: false, error: "Missing category id" } as ApiResponse, { status: 400 })
      }

      const body = await req.json()
      const { name, description } = body || {}

      console.debug("PUT /api/admin/categories/:id", { id, body, user: req.auth })

      if (!name) {
        return NextResponse.json({ success: false, error: "Category name required" } as ApiResponse, { status: 400 })
      }

      const slug = name.toLowerCase().replace(/\s+/g, "-")

      const category = await prisma.category.update({
        where: { id },
        data: { name, slug },
      })

      return NextResponse.json({ success: true, data: category } as ApiResponse)
    } catch (error: any) {
      console.error("Update category error:", error && (error.stack || error))
      if (error?.code === "P2025") {
        return NextResponse.json({ success: false, error: "Category not found" } as ApiResponse, { status: 404 })
      }
      if (error?.code === "P2002") {
        return NextResponse.json({ success: false, error: "Category name already exists" } as ApiResponse, { status: 409 })
      }
      return NextResponse.json({ success: false, error: "Failed to update category" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}

// DELETE - Admin only: Delete category
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params

      await prisma.category.delete({ where: { id } })

      return NextResponse.json({ success: true } as ApiResponse)
    } catch (error: any) {
      if (error.code === "P2025") {
        return NextResponse.json({ success: false, error: "Category not found" } as ApiResponse, { status: 404 })
      }
      console.error("Delete category error:", error)
      return NextResponse.json({ success: false, error: "Failed to delete category" } as ApiResponse, { status: 500 })
    }
  })(request as AuthenticatedRequest)
}
