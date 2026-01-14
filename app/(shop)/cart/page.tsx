"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CartItemSkeleton } from "@/components/ui/loading-skeletons"
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, CreditCard } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CartItem {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    images: Array<{ url: string }>
    stock: number
  }
}

interface Cart {
  id: string
  items: CartItem[]
  total: number
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }
    fetchCart()
  }, [router])

  async function fetchCart() {
    const token = localStorage.getItem("accessToken")
    if (!token) return

    try {
      const response = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setCart(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error)
      toast({
        title: "Error",
        description: "Failed to load cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    const token = localStorage.getItem("accessToken")
    if (!token) return

    setUpdating(productId)
    try {
      const response = await fetch("/api/cart/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      })

      const data = await response.json()
      if (data.success) {
        fetchCart()
        if (quantity === 0) {
          toast({
            title: "Item Removed",
            description: "Item has been removed from your cart.",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update cart.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update cart:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0
  const subtotal = cart?.total || 0
  const shipping = 0 // Free shipping
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shipping + tax

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={0} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CartItemSkeleton key={i} />
                ))}
              </div>
              <div className="h-64 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cartItemCount} />

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Shopping Cart</span>
          </nav>
        </div>
      </div>

      {/* Cart Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {cartItemCount > 0 ? `${cartItemCount} item${cartItemCount > 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
            </p>
          </div>
        </div>

        {!cart || cart.items.length === 0 ? (
          <Card className="p-12 text-center animate-fade-in">
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-6">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <Link href="/">
                  <Button size="lg" className="group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, index) => (
                <Card key={item.id} className="p-6 group hover:shadow-md transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-muted rounded-lg relative flex-shrink-0 overflow-hidden">
                      {item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0].url || "/placeholder.svg"}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <Link 
                          href={`/product/${item.product.id}`}
                          className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-muted-foreground mt-1">
                          ${item.product.price.toFixed(2)} each
                        </p>
                        {item.product.stock <= 5 && item.product.stock > 0 && (
                          <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-700">
                            Only {item.product.stock} left
                          </Badge>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">Qty:</span>
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, Math.max(0, item.quantity - 1))}
                              disabled={updating === item.productId || item.quantity <= 1}
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-12 text-center text-sm font-semibold">
                              {updating === item.productId ? "..." : item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={updating === item.productId || item.quantity >= item.product.stock}
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, 0)}
                          disabled={updating === item.productId}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right flex flex-col justify-between">
                      <p className="text-lg font-bold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          ${item.product.price.toFixed(2)} × {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Continue Shopping */}
              <div className="pt-4">
                <Link href="/">
                  <Button variant="outline" className="group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24 animate-slide-up">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({cartItemCount} items)</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/checkout" className="block">
                    <Button className="w-full h-12 text-base font-medium group">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                  </Link>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Secure checkout with SSL encryption
                  </p>
                </div>

                {/* Promo Code */}
                <div className="mt-6 pt-6 border-t">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <span>Have a promo code?</span>
                      <span className="group-open:rotate-180 transition-transform">↓</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button variant="outline" size="sm" className="w-full">
                        Apply Code
                      </Button>
                    </div>
                  </details>
                </div>
              </Card>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
