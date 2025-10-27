"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  todaySales: number
  todayRevenue: number
  lowStockProducts: number
  activeCustomers: number
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayRevenue: 0,
    lowStockProducts: 0,
    activeCustomers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      // Don't fetch if still checking authentication
      if (authLoading) return
      
      try {
        const today = new Date().toISOString().split("T")[0]

        // Fetch daily sales report
        const dailyReport: any = await apiClient.reports
          .generateDailySales(today)
          .catch(() => ({ totalSales: 0, totalRevenue: 0 }))

        // Fetch low stock products
  const lowStockProducts: any = await apiClient.products.getLowStock().catch(() => [])

        // Fetch customers (to count active ones)
        const customers: any = await apiClient.customers.getAll().catch((err: any) => {
          // Log full error and server payload (api-client attaches `server`)
          console.error("[v0] customers fetch error:", err)
          console.error("[v0] customers fetch server payload:", err?.server)
          return []
        })

        setStats({
          todaySales: dailyReport.totalSales || 0,
          todayRevenue: dailyReport.totalRevenue || 0,
          lowStockProducts: lowStockProducts.length || 0,
          activeCustomers: customers.length || 0,
        })
      } catch (error) {
        console.error("[v0] Failed to fetch dashboard stats:", error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [authLoading])

  const statCards = [
    {
      title: "Ventes du jour",
      value: stats.todaySales,
      icon: ShoppingCart,
      description: "Nombre de transactions",
      color: "text-chart-1",
    },
    {
      title: "Chiffre d'affaires",
      value: `${stats.todayRevenue.toLocaleString()} XOF`,
      icon: DollarSign,
      description: "Revenus du jour",
      color: "text-chart-2",
    },
    {
      title: "Stock faible",
      value: stats.lowStockProducts,
      icon: AlertCircle,
      description: "Produits à réapprovisionner",
      color: "text-destructive",
    },
    {
      title: "Clients actifs",
      value: stats.activeCustomers,
      icon: Users,
      description: "Total des clients",
      color: "text-chart-3",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground mt-2">Bienvenue, {user?.firstName}. Voici un aperçu de votre activité.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{card.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Ventes récentes</CardTitle>
              <CardDescription>Aperçu des dernières transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">Les données de ventes seront affichées ici</div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Produits populaires</CardTitle>
              <CardDescription>Top 5 des ventes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">Les produits populaires seront affichés ici</div>
            </CardContent>
          </Card>
        </div>

        {user?.role === "ADMIN" && (
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Raccourcis pour les tâches courantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="pt-6 text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Ajouter un produit</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="pt-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Nouveau client</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Voir les rapports</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
