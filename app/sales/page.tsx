"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import type { Sale } from "@/lib/types"
import { Search, Eye, FileText } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function SalesPage() {
  const { loading: authLoading } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ne pas charger les données si l'authentification est en cours
    if (authLoading) return
    fetchSales()
  }, [authLoading])

  const fetchSales = async () => {
    if (!authLoading) {
      try {
        setLoading(true)
        // Obtenir les ventes du jour
        const today = new Date()
        const startDate = new Date(today)
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(today)
        endDate.setHours(23, 59, 59, 999)

        const data = await apiClient.sales.getByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        )
        setSales(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch sales:", error)
        setSales([])
      } finally {
        setLoading(false)
      }
    }
  }

  const filteredSales = (Array.isArray(sales) ? sales : []).filter(
    (sale) =>
      (sale.saleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sale.cashierId || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      COMPLETED: "default",
      PENDING: "secondary",
      CANCELLED: "destructive",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
            <p className="text-muted-foreground mt-2">Gérez et consultez toutes les transactions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des ventes</CardTitle>
                <CardDescription>Historique complet des transactions</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou caissier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Caissier</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune vente trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell>{format(new Date(sale.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}</TableCell>
                      <TableCell>{sale.cashierId}</TableCell>
                      <TableCell>{sale.items.length}</TableCell>
                      <TableCell className="font-medium">{sale.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{sale.currency}</TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la vente</DialogTitle>
            <DialogDescription>Vente #{selectedSale?.saleNumber}</DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedSale.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Articles</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.unitPrice.toLocaleString()} {selectedSale.currency}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.totalPrice.toLocaleString()} {selectedSale.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>
                    {selectedSale.subtotal.toLocaleString()} {selectedSale.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span>
                    {selectedSale.taxAmount.toLocaleString()} {selectedSale.currency}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {selectedSale.totalAmount.toLocaleString()} {selectedSale.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
