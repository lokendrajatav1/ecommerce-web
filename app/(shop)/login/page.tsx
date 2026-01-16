"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<"login" | "register">("login")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body: any = { email, password }
      if (mode === "register") {
        body.name = name || email.split("@")[0]
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("accessToken", data.data.accessToken)
        localStorage.setItem("refreshToken", data.data.refreshToken)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        
        toast({
          title: "Success!",
          description: mode === "login" ? "Welcome back!" : "Account created successfully!",
        })
        
        // Redirect based on user role
        const redirectTo = data.data.user?.role === "ADMIN" ? "/admin/dashboard" : "/"
        router.push(redirectTo)
      } else {
        toast({
          title: "Error",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-premium-lg group-hover:shadow-premium-lg group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-bold text-xl">eC</span>
            </div>
            <span className="font-bold text-2xl gradient-text">
              eCommerce
            </span>
          </Link>
        </div>

        <Card className="glass-card border-border/50 shadow-premium-lg backdrop-blur-xl">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full text-xs font-medium mb-4">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>{mode === "login" ? "Welcome Back" : "Join Us"}</span>
              </div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">
                {mode === "login" ? "Sign In" : "Create Account"}
              </h1>
              <p className="text-muted-foreground text-balance">
                {mode === "login" 
                  ? "Sign in to your account to continue shopping" 
                  : "Join thousands of happy customers today"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "register" && (
                <div className="space-y-2 animate-slide-down">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 border border-gray-200 rounded-md bg-card/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border border-gray-200 rounded-md bg-card/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border border-gray-200 rounded-md bg-card/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded border-border focus:ring-primary focus:ring-2 focus:ring-offset-0 transition-all duration-200" 
                    />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">Remember me</span>
                  </label>
                  <button type="button" className="text-primary hover:text-primary/80 hover:underline transition-all duration-200">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 text-base font-medium gradient-primary shadow-premium hover-lift group transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                )}
              </Button>
            </form>

            <div className="my-6" />

            {/* Switch Mode */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login")
                  setName("")
                }}
                className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-all duration-200"
              >
                {mode === "login" ? "Create an account" : "Sign in instead"}
              </button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p className="text-balance">
            By continuing, you agree to our{" "}
            <button className="text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
              Terms of Service
            </button>
            {" "}and{" "}
            <button className="text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
