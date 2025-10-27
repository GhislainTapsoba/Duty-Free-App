"use client"

import type React from "react"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { ProtectedRoute } from "./protected-route"

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
              <SidebarTrigger />
            </header>
            <div className="flex-1 p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
