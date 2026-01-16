"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setLoading(false)
      toast({ title: "Unauthorized", description: "Please sign in to view your profile", variant: "destructive" })
      router.push("/login")
      return
    }
    try {
      const res = await fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) {
        toast({ title: "Unauthorized", description: "Session expired, please sign in again", variant: "destructive" })
        localStorage.removeItem("accessToken")
        router.push("/login")
        return
      }
      const json = await res.json()
      if (json.success) {
        setProfile(json.data)
        setName(json.data.name)
        setEmail(json.data.email)
      } else {
        toast({ title: "Error", description: json.error || "Failed to load profile", variant: "destructive" })
      }
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem("accessToken")
    if (!token) return toast({ title: "Unauthorized", description: "Please sign in", variant: "destructive" })
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email }),
      })
      if (res.status === 401) return router.push("/login")
      const json = await res.json()
      if (json.success) {
        toast({ title: "Saved", description: "Profile updated" })
        setProfile(json.data)
        localStorage.setItem("user", JSON.stringify(json.data))
      } else {
        toast({ title: "Error", description: json.error || "Failed to update", variant: "destructive" })
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword) return toast({ title: "Error", description: "Enter current and new password", variant: "destructive" })
    const token = localStorage.getItem("accessToken")
    if (!token) return toast({ title: "Unauthorized", description: "Please sign in", variant: "destructive" })
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.status === 401) return router.push("/login")
      const json = await res.json()
      if (json.success) {
        toast({ title: "Saved", description: "Password changed" })
        setCurrentPassword("")
        setNewPassword("")
      } else {
        toast({ title: "Error", description: json.error || "Failed to change password", variant: "destructive" })
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" })
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Profile Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your account details and update your password to keep your account secure.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-lg font-semibold flex items-center justify-center text-muted-foreground">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="font-semibold text-lg">{name || "Your Name"}</div>
              <div className="text-sm text-muted-foreground">{email || "you@example.com"}</div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-3 h-10 border border-gray-200 rounded-md bg-card/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-3 h-10 border border-gray-200 rounded-md bg-card/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="px-5">Save</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-2">Change Password</h2>
          <p className="text-sm text-muted-foreground mb-4">Update your password regularly. Use a strong, unique password.</p>

          <form onSubmit={changePassword} className="grid grid-cols-1 gap-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full pl-3 h-10 border border-gray-200 rounded-md bg-card/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200" />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-3 h-10 border border-gray-200 rounded-md bg-card/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="ghost" className="px-5">Change Password</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
