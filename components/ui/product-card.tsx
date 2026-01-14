"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Eye, Star, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  images: Array<{ url: string }>
  category: { name: string }
  rating?: number
  reviewCount?: number
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
  isInWishlist?: boolean
  className?: string
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onToggleWishlist, 
  isInWishlist = false,
  className 
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product.id)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleWishlist?.(product.id)
  }

  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5
  const isBestSeller = product.rating && product.rating >= 4.5

  return (
    <Card className={cn(
      "group relative overflow-hidden glass-card hover-lift shadow-premium transition-all duration-500",
      isOutOfStock && "opacity-75",
      className
    )}>
      <Link 
        href={`/product/${product.id}`} 
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="aspect-square bg-gradient-secondary relative overflow-hidden">
          {product.images.length > 0 && !imageError ? (
            <Image
              src={product.images[0].url || "/placeholder.svg"}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-all duration-700 group-hover:scale-110",
                imageLoading && "opacity-0",
                isHovered && "brightness-110"
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-secondary">
              <div className="text-center animate-float">
                <div className="w-16 h-16 mx-auto mb-2 bg-muted/50 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">No image</p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-secondary animate-pulse" />
          )}

          {/* Overlay Actions */}
          <div className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              <Button
                size="sm"
                className="glass-card hover:glass text-white shadow-premium-lg hover-lift"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className={cn(
                  "glass-card shadow-premium-lg hover-lift transition-all duration-300",
                  isInWishlist ? "text-red-500 hover:text-red-600" : "text-white hover:text-red-500"
                )}
                onClick={handleToggleWishlist}
              >
                <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isBestSeller && (
              <Badge className="gradient-accent text-white shadow-premium animate-bounce-in">
                <Zap className="w-3 h-3 mr-1" />
                Best Seller
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="shadow-premium animate-fade-in">
                Out of Stock
              </Badge>
            )}
            {isLowStock && (
              <Badge className="bg-orange-500 text-white shadow-premium animate-fade-in">
                Low Stock
              </Badge>
            )}
          </div>

          {/* Wishlist indicator */}
          {isInWishlist && (
            <div className="absolute top-3 right-3">
              <Heart className="w-5 h-5 text-red-500 fill-current animate-bounce-in shadow-premium" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Category */}
          <Badge variant="outline" className="text-xs font-medium glass-card">
            {product.category.name}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 text-balance">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5 transition-colors duration-200",
                      i < Math.floor(product.rating!) 
                        ? "text-yellow-400 fill-current" 
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Price and Stock */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <span className="text-xl font-bold gradient-text">
                ${product.price.toFixed(2)}
              </span>
            </div>
            
            <div className="text-right">
              <span className={cn(
                "text-xs px-3 py-1.5 rounded-full font-medium shadow-premium transition-all duration-200",
                product.stock > 0 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {product.stock > 0 ? `${product.stock} left` : "Sold out"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}

export function ProductGrid({ 
  products, 
  onAddToCart, 
  onToggleWishlist, 
  wishlistItems = [],
  className 
}: {
  products: Product[]
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
  wishlistItems?: string[]
  className?: string
}) {
  return (
    <div className={cn(
      "grid-responsive",
      className
    )}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isInWishlist={wishlistItems.includes(product.id)}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}