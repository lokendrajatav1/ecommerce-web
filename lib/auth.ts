import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { prisma } from "./prisma"

const ACCESS_TOKEN_EXPIRY = "4d" // 4 days
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export async function hashAndStoreRefreshToken(userId: string, refreshToken: string): Promise<string> {
  const hashedToken = await bcrypt.hash(refreshToken, 12)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000)

  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt,
    },
  })

  return hashedToken
}

export function verifyAccessToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(userId: string, token: string): Promise<boolean> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string }
    if (decoded.userId !== userId) return false

    const storedToken = await prisma.refreshToken.findFirst({
      where: { userId },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return false
    }

    return await bcrypt.compare(token, storedToken.token)
  } catch {
    return false
  }
}
