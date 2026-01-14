export interface AuthPayload {
  userId: string
  role: "ADMIN" | "CUSTOMER"
  iat?: number
  exp?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}
