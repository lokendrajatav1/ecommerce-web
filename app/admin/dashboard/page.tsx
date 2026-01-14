"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardStatsSkeleton, TableSkeleton } from "@/components/ui/loading-skeletons"
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  TrendingUp,
  Calendar
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DashboardData {
  stats: {
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    totalCustomers: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "categories">("overview")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const user = localStorage.getItem("user")

    if (!token || !user) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(user)

      // Prefer role from decoded token payload if available (safer when user was promoted server-side)
      let roleFromToken: string | null = null
      try {
        const parts = token.split('.')
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const json = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
              .join('')
          )
          const payload = JSON.parse(json)
          roleFromToken = payload?.role ?? null
        }
      } catch (e) {
        // ignore token decode errors — we'll fall back to stored user
        roleFromToken = null
      }

      const effectiveRole = roleFromToken || parsedUser.role
      if (effectiveRole !== "ADMIN") {
        router.push("/")
        return
      }
    } catch {
      router.push("/login")
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <DashboardStatsSkeleton />
            <TableSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Admin Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 animate-fade-in">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your eCommerce store</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {([
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "products", label: "Products", icon: Package },
              { id: "orders", label: "Orders", icon: ShoppingCart },
              { id: "categories", label: "Categories", icon: Users }
            ] as const).map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "categories" && <CategoriesTab />}
      </div>
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, customers: 0 })
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
    fetchRecentOrders()
  }, [])

  async function fetchStats() {
    const token = localStorage.getItem("accessToken")
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch("/api/products?take=1", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ])

      const productsData = await productsRes.json()
      const ordersData = await ordersRes.json()

      const totalRevenue = ordersData.data?.reduce((sum: number, order: any) => sum + order.total, 0) || 0
      const uniqueCustomers = new Set(ordersData.data?.map((order: any) => order.userId) || []).size

      setStats({
        products: productsData.data?.total || 0,
        orders: ordersData.data?.length || 0,
        revenue: totalRevenue,
        customers: uniqueCustomers,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard stats.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecentOrders() {
    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch("/api/orders?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setRecentOrders(data.data?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error("Failed to fetch recent orders:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.products,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      change: "+12%",
      changeType: "positive" as const
    },
    {
      title: "Total Orders",
      value: stats.orders,
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      change: "+8%",
      changeType: "positive" as const
    },
    {
      title: "Total Revenue",
      value: `$${stats.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      change: "+15%",
      changeType: "positive" as const
    },
    {
      title: "Customers",
      value: stats.customers,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      change: "+5%",
      changeType: "positive" as const
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6 hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent orders</p>
            ) : (
              recentOrders.map((order, index) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                    <Badge 
                      variant={order.status === "DELIVERED" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '#products'}
            >
              <Plus className="w-5 h-5" />
              Add Product
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '#orders'}
            >
              <Eye className="w-5 h-5" />
              View Orders
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '#categories'}
            >
              <Plus className="w-5 h-5" />
              Add Category
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
            >
              <Calendar className="w-5 h-5" />
              Reports
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function ProductsTab() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({ 
    name: "", 
    price: "", 
    stock: "", 
    categoryId: "", 
    description: "" 
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  async function fetchProducts() {
    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setProducts(data.data.products)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem("accessToken")
    
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number.parseFloat(formData.price),
          stock: Number.parseInt(formData.stock),
          categoryId: formData.categoryId,
          description: formData.description,
          images: [],
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowForm(false)
        setEditingProduct(null)
        setFormData({ name: "", price: "", stock: "", categoryId: "", description: "" })
        fetchProducts()
        toast({
          title: "Success",
          description: `Product ${editingProduct ? 'updated' : 'created'} successfully.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save product.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save product:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        fetchProducts()
        toast({
          title: "Success",
          description: "Product deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete product.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  function handleEdit(product: any) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: product.categoryId,
      description: product.description || "",
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <TableSkeleton rows={8} cols={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button 
          onClick={() => {
            setEditingProduct(null)
            setFormData({ name: "", price: "", stock: "", categoryId: "", description: "" })
            setShowForm(!showForm)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                  setFormData({ name: "", price: "", stock: "", categoryId: "", description: "" })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Stock</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No products found. Add your first product to get started.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{product.category?.name}</Badge>
                    </td>
                    <td className="p-4 font-medium">${product.price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={product.stock > 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const token = localStorage.getItem("accessToken")
    try {
      // Admin dashboard should fetch all orders via admin endpoint
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch admin orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()
      if (data.success) {
        fetchOrders()
        toast({
          title: "Success",
          description: "Order status updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update order status.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Orders</h2>
        <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Order ID</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-sm">#{order.id.slice(-8)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium">${order.total.toFixed(2)}</td>
                    <td className="p-4">
                        <Badge 
                          variant={order.status === "DELIVERED" ? "default" : "secondary"}
                        >
                          {order.status}
                        </Badge>
                    </td>
                    <td className="p-4">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem("accessToken")
    
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories"
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setShowForm(false)
        setEditingCategory(null)
        setFormData({ name: "", description: "" })
        fetchCategories()
        toast({
          title: "Success",
          description: editingCategory ? "Category updated successfully." : "Category created successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || (editingCategory ? "Failed to update category." : "Failed to create category."),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create category:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm("Are you sure you want to delete this category?")) return

    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        fetchCategories()
        toast({ title: "Success", description: "Category deleted successfully." })
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete category.", variant: "destructive" })
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast({ title: "Error", description: "An error occurred. Please try again.", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <TableSkeleton rows={4} cols={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-muted-foreground">Organize your products into categories</p>
        </div>
        <Button 
          onClick={() => {
            setEditingCategory(null)
            setFormData({ name: "", description: "" })
            setShowForm(!showForm)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Category"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4">{editingCategory ? "Edit Category" : "Add New Category"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                type="text"
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                placeholder="Enter category description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">{editingCategory ? "Update Category" : "Add Category"}</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false)
                  setEditingCategory(null)
                  setFormData({ name: "", description: "" })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first category to organize your products.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          categories.map((category, index) => (
            <Card key={category.id} className="p-6 hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline">
                    {category._count?.products || 0} products
                  </Badge>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingCategory(category)
                      setFormData({ name: category.name, description: category.description || "" })
                      setShowForm(true)
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
