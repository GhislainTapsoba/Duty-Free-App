"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { apiClient } from "./api-client"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        try {
          const currentUser = await apiClient.auth.getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error("Failed to fetch current user:", error)
          localStorage.removeItem("auth_token")
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.auth.login({ username, password })

      // Extract token and user from response
      const { token, ...userData } = response

      // Store token (already done in apiClient, but keeping for clarity)
      localStorage.setItem("auth_token", token)

      // Set user state
      setUser(userData as User)

      // Redirect based on role
      switch (userData.role) {
        case "CASHIER":
          router.push("/pos")
          break
        case "STOCK_MANAGER":
          router.push("/stocks")
          break
        default:
          router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.auth.logout()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
      setUser(null)
      router.push("/login")
    }
  }

  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
