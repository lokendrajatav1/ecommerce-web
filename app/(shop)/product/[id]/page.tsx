"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  images: Array<{ url: string }>
  category: { name: string }
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    params.then(({ id }) => {
      fetchProduct(id)
    })
  }, [params])

  async function fetchProduct(id: string) {
    try {
      const response = await fetch(`/api/products/${id}`)
      const data = await response.json()
      if (data.success) {
        setProduct(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setLoading(false)
    }
  }

  async function addToCart() {
    if (!product || !localStorage.getItem("accessToken")) {
      router.push("/login")
      return
    }

    setAdding(true)
    setError("")

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ productId: product.id, quantity }),
      })

      const data = await response.json()
      if (data.success) {
        router.push("/cart")
      } else {
        setError(data.error || "Failed to add to cart")
      }
    } catch (error) {
      setError("An error occurred")
      console.error(error)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Product not found</p>
        <Link href="/">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">eC</span>
            </div>
            <span className="font-semibold">eCommerce</span>
          </Link>
        </div>
      </header>

      {/* Product Details */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
            {product.images.length > 0 ? (
              <Image
                src={product.images[0].url || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{product.category.name}</p>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mb-4">${product.price}</p>

              {product.description && <p className="text-muted-foreground mb-6">{product.description}</p>}

              <div className="mb-6">
                <p className={`text-sm font-semibold ${product.stock > 0 ? "text-green-700" : "text-red-700"}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>
              </div>
            </div>

            {/* Add to Cart */}
            <Card className="p-6 space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button onClick={addToCart} disabled={product.stock === 0 || adding} className="w-full" size="lg">
                {adding ? "Adding..." : "Add to Cart"}
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
