"use client"

import type React from "react"

import { useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { LogOut, User, Home, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "@/features/auth/authSlice"
import type { AppDispatch } from "@/store" // We'll need to add this type to the store

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  // Use the typed dispatch
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: any) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, navigate])

  const handleLogout = () => {
    // Make sure the logout action properly clears the token
    localStorage.removeItem("token")
    dispatch(logout())
    navigate("/login")
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="mr-4 flex">
            <Link className="mr-6 flex items-center space-x-2" to="/">
              <span className="font-bold sm:inline-block">AI Real Estate Agent</span>
            </Link>
            <nav className="flex items-center space-x-4 lg:space-x-6">
              <Link to="/" className="flex items-center text-sm font-medium transition-colors hover:text-primary">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/agent-testing"
                className="flex items-center text-sm font-medium transition-colors hover:text-primary"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Test Agent
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">Welcome, {user?.username || "User"}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  )
}

