"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import type { SalesReport } from "@/lib/types"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const [period, setPeriod] = useState("today")
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchReport()
  }, [period])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<SalesReport>(`/reports/sales?period=${period}`)
      setReport(data)
    } catch (error) {
      console.error("Failed to fetch report:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le rapport",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      toast({
        title: "Export en cours",
        description: `Génération du rapport ${format.toUpperCase()}...`,
      })
      // API call to export report
      await apiClient.get(`/reports/export?period=${period}&format=${format}`)
      toast({
        title: "Export réussi",
        description: "Le rapport a été téléchargé",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le rapport",
        variant: "destructive",
      })
    }
  }

  const COLORS = [
    "oklch(0.55 0.12 200)",
    "oklch(0.6 0.15 280)",
    "oklch(0.65 0.18 160)",
    "oklch(0.7 0.12 60)",
    "oklch(0.5 0.2 340)",
  ]

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapports et analyses</h1>
            <p className="text-muted-foreground mt-2">Visualisez vos performances commerciales</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement des données...</div>
        ) : report ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.totalSales}</div>
                  <p className="text-xs text-muted-foreground mt-1">Transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                  <DollarSign className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.totalRevenue.toLocaleString()} XOF</div>
                  <p className="text-xs text-muted-foreground mt-1">Revenus</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket moyen</CardTitle>
                  <TrendingUp className="h-4 w-4 text-chart-3" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.averageTicket.toLocaleString()} XOF</div>
                  <p className="text-xs text-muted-foreground mt-1">Par transaction</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits vendus</CardTitle>
                  <Package className="h-4 w-4 text-chart-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.topProducts.reduce((sum, p) => sum + p.quantity, 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unités</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="sales" className="space-y-4">
              <TabsList>
                <TabsTrigger value="sales">Ventes</TabsTrigger>
                <TabsTrigger value="products">Produits</TabsTrigger>
                <TabsTrigger value="categories">Catégories</TabsTrigger>
                <TabsTrigger value="payments">Paiements</TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des ventes</CardTitle>
                    <CardDescription>Chiffre d'affaires sur la période</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart
                        data={[
                          { name: "Lun", ventes: 4000 },
                          { name: "Mar", ventes: 3000 },
                          { name: "Mer", ventes: 5000 },
                          { name: "Jeu", ventes: 4500 },
                          { name: "Ven", ventes: 6000 },
                          { name: "Sam", ventes: 7000 },
                          { name: "Dim", ventes: 5500 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ventes" stroke="oklch(0.55 0.12 200)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 produits</CardTitle>
                      <CardDescription>Produits les plus vendus</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                            <TableHead className="text-right">CA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.topProducts.slice(0, 10).map((product, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell className="text-right">{product.quantity}</TableCell>
                              <TableCell className="text-right">{product.revenue.toLocaleString()} XOF</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition des ventes</CardTitle>
                      <CardDescription>Par produit</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={report.topProducts.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="productName" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="quantity" fill="oklch(0.55 0.12 200)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ventes par catégorie</CardTitle>
                      <CardDescription>Répartition du chiffre d'affaires</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={report.salesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.category}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="revenue"
                          >
                            {report.salesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Détails par catégorie</CardTitle>
                      <CardDescription>Quantités et revenus</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                            <TableHead className="text-right">CA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.salesByCategory.map((category, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{category.category}</TableCell>
                              <TableCell className="text-right">{category.quantity}</TableCell>
                              <TableCell className="text-right">{category.revenue.toLocaleString()} XOF</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Modes de paiement</CardTitle>
                      <CardDescription>Répartition des paiements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={report.salesByPaymentMethod}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.method}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {report.salesByPaymentMethod.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Détails des paiements</CardTitle>
                      <CardDescription>Par mode de paiement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mode</TableHead>
                            <TableHead className="text-right">Transactions</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.salesByPaymentMethod.map((payment, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{payment.method}</TableCell>
                              <TableCell className="text-right">{payment.count}</TableCell>
                              <TableCell className="text-right">{payment.amount.toLocaleString()} XOF</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Aucune donnée disponible pour cette période</div>
        )}
      </div>
    </DashboardLayout>
  )
}
