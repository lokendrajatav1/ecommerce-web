"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Search, Filter, Star } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  images: Array<{ url: string }>
  category: { name: string }
}

interface Category {
  id: string
  name: string
}

export default function ShopPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [productsRes, categoriesRes, cartRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        }).catch(() => ({ json: async () => ({ success: false }) })),
        fetch("/api/cart", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        }).catch(() => ({ json: async () => ({ success: false }) }))
      ])

      const productsData = await productsRes.json()
      if (productsData.success) setProducts(productsData.data.products)

      const categoriesData = await categoriesRes.json()
      if (categoriesData.success) setCategories(categoriesData.data)

      const cartData = await cartRes.json()
      if (cartData.success && cartData.data?.items) {
        setCartCount(cartData.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0))
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function addToCart(e: React.MouseEvent, productId: string) {
    e.stopPropagation()
    const token = localStorage.getItem("accessToken")
    if (!token) {
      toast({ title: "Login Required", description: "Please login to add items", variant: "destructive" })
      return
    }

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: 1 })
      })

      const data = await res.json()
      if (data.success) {
        setCartCount(prev => prev + 1)
        toast({ title: "Success", description: "Added to cart" })
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add to cart", variant: "destructive" })
    }
  }

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === "all" || p.category.name === categoryFilter
      return matchSearch && matchCategory
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price
      if (sortBy === "price-high") return b.price - a.price
      return a.name.localeCompare(b.name)
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header cartItemCount={cartCount} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-80 animate-pulse border border-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItemCount={cartCount} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to Our Store</h1>
          <p className="text-xl opacity-90">Discover amazing products at great prices</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full border-border rounded-md no-shadows"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 border-border rounded-md no-shadows">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 border-border rounded-md no-shadows">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          <p className="text-gray-600">{filtered.length} products found</p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => (
              <div 
                key={product.id} 
                onClick={() => router.push(`/product/${product.id}`)}
                className="bg-white rounded-lg overflow-hidden cursor-pointer border border-border no-shadows"
              >
                <div className="relative h-64 bg-gray-100">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {product.stock < 10 && product.stock > 0 && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      Only {product.stock} left
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Out of Stock
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase">{product.category.name}</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-bold text-blue-600">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button
                      onClick={(e) => addToCart(e, product.id)}
                      disabled={product.stock === 0}
                      size="sm"
                      className="gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
