import type React from "react"

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  // This nested layout intentionally omits the global Header
  return <>{children}</>
}
