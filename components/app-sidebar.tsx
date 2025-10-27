"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Plane,
  DollarSign,
  FileText,
  TrendingUp,
  Boxes,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPERVISOR", "CASHIER", "STOCK_MANAGER"],
  },
  {
    title: "Point de vente",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["ADMIN", "SUPERVISOR", "CASHIER"],
  },
  {
    title: "Ventes",
    href: "/sales",
    icon: DollarSign,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Produits",
    href: "/products",
    icon: Package,
    roles: ["ADMIN", "SUPERVISOR", "STOCK_MANAGER"],
  },
  {
    title: "Stocks",
    href: "/stocks",
    icon: Boxes,
    roles: ["ADMIN", "SUPERVISOR", "STOCK_MANAGER"],
  },
  {
    title: "Clients",
    href: "/customers",
    icon: Users,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Fidélité",
    href: "/loyalty",
    icon: TrendingUp,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Paiements",
    href: "/payments",
    icon: CreditCard,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Caisses",
    href: "/cash-registers",
    icon: FileText,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Commandes",
    href: "/purchase-orders",
    icon: FileText,
    roles: ["ADMIN", "SUPERVISOR", "STOCK_MANAGER"],
  },
  {
    title: "Rapports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Paramètres",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role))

  const getInitials = (firstName?: string, lastName?: string) => {
    const firstInitial = firstName?.charAt(0) || ''
    const lastInitial = lastName?.charAt(0) || ''
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Plane className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">DJBC Duty Free</h2>
            <p className="text-xs text-muted-foreground">Système de gestion</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
