import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

type ApiResponse = { success: boolean; url?: string; data?: any; error?: string }

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get("file") as Blob | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" } as ApiResponse, { status: 400 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: "Cloudinary not configured" } as ApiResponse, { status: 500 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const signature = crypto.createHash("sha1").update(`timestamp=${timestamp}${apiSecret}`).digest("hex")

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

    const uploadForm = new FormData()
    // Convert Blob to something fetch can send
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    // Node's FormData accepts Blob; create a Blob from buffer
    const blob = new Blob([buffer])
    uploadForm.append("file", blob)
    uploadForm.append("api_key", apiKey)
    uploadForm.append("timestamp", String(timestamp))
    uploadForm.append("signature", signature)

    const res = await fetch(uploadUrl, { method: "POST", body: uploadForm })
    const json = await res.json()

    if (!res.ok) {
      return NextResponse.json({ success: false, error: json.error?.message || "Upload failed" } as ApiResponse, { status: res.status })
    }

    return NextResponse.json({ success: true, url: json.secure_url, data: json } as ApiResponse)
  } catch (error: any) {
    console.error("Cloudinary upload error:", error)
    return NextResponse.json({ success: false, error: error?.message || "Upload error" } as ApiResponse, { status: 500 })
  }
}
