"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Cart {
  id: string
  items: any[]
  total: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

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
    } finally {
      setLoading(false)
    }
  }

  async function placeOrder() {
    const token = localStorage.getItem("accessToken")
    if (!token || !cart) return

    setPlacing(true)
    setError("")

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/order/${data.data.id}`)
      } else {
        setError(data.error || "Failed to place order")
      }
    } catch (error) {
      setError("An error occurred")
      console.error(error)
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Your cart is empty</p>
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

      {/* Checkout */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">Order Details</h2>
              {error && <p className="text-sm text-destructive mb-4">{error}</p>}
              <p className="text-muted-foreground mb-6">
                Review your items below and click "Place Order" to complete your purchase.
              </p>
              <p className="text-sm text-muted-foreground">
                Note: This is a demo checkout. In a production app, you would integrate payment processing here.
              </p>
            </Card>
          </div>

          {/* Summary */}
          <Card className="p-6 h-fit sticky top-20">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6 text-sm">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.product.name} x{item.quantity}
                  </span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={placeOrder} disabled={placing} className="w-full">
              {placing ? "Placing Order..." : "Place Order"}
            </Button>
          </Card>
        </div>
      </section>
    </div>
  )
}
