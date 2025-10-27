"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import type { Product, StockMovement, Sommier } from "@/lib/types"
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function StocksPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [sommiers, setSommiers] = useState<Sommier[]>([])
  const [showMovementDialog, setShowMovementDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [movementForm, setMovementForm] = useState({
    productId: "",
    type: "ENTRY" as "ENTRY" | "EXIT" | "ADJUSTMENT" | "WASTAGE",
    quantity: 0,
    reason: "",
    sommierId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch each resource separately to handle individual failures
      try {
        const productsData = await apiClient.get<Product[]>("/products")
        setProducts(productsData)
      } catch (error) {
        console.error("Failed to fetch products:", error)
        toast({
          title: "Error",
          description: "Unable to load products",
          variant: "destructive",
        })
      }

      try {
        const movementsData = await apiClient.get<StockMovement[]>("/stocks/movements")
        setMovements(movementsData)
      } catch (error) {
        console.error("Failed to fetch stock movements:", error)
        toast({
          title: "Error",
          description: "Unable to load stock movements",
          variant: "destructive",
        })
      }

      try {
        const sommiersData = await apiClient.get<Sommier[]>("/sommiers")
        setSommiers(sommiersData)
      } catch (error) {
        console.error("Failed to fetch sommiers:", error)
        toast({
          title: "Error",
          description: "Unable to load sommiers",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Unable to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post("/stocks/movements", movementForm)
      toast({
        title: "Mouvement enregistré",
        description: "Le mouvement de stock a été enregistré avec succès",
      })
      fetchData()
      setShowMovementDialog(false)
      setMovementForm({
        productId: "",
        type: "ENTRY",
        quantity: 0,
        reason: "",
        sommierId: "",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le mouvement",
        variant: "destructive",
      })
    }
  }

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockLevel)
  const outOfStockProducts = products.filter((p) => p.stockQuantity === 0)

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "ENTRY":
        return <TrendingUp className="h-4 w-4 text-chart-2" />
      case "EXIT":
        return <TrendingDown className="h-4 w-4 text-destructive" />
      case "ADJUSTMENT":
        return <Package className="h-4 w-4 text-chart-3" />
      case "WASTAGE":
        return <AlertTriangle className="h-4 w-4 text-chart-4" />
      default:
        return null
    }
  }

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR", "STOCK_MANAGER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des stocks</h1>
            <p className="text-muted-foreground mt-2">Suivez et gérez vos inventaires et sommiers</p>
          </div>
          <Button onClick={() => setShowMovementDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau mouvement
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.stockQuantity, 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Unités en stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
              <AlertTriangle className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Produits à réapprovisionner</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rupture de stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outOfStockProducts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Produits épuisés</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
            <TabsTrigger value="sommiers">Sommiers</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>État des stocks</CardTitle>
                <CardDescription>Vue d'ensemble de l'inventaire actuel</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Min. requis</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.nameFr}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.stockQuantity}</TableCell>
                        <TableCell>{product.minStockLevel}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.stockQuantity === 0
                                ? "destructive"
                                : product.stockQuantity <= product.minStockLevel
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {product.stockQuantity === 0
                              ? "Rupture"
                              : product.stockQuantity <= product.minStockLevel
                                ? "Faible"
                                : "Normal"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des mouvements</CardTitle>
                <CardDescription>Tous les mouvements de stock enregistrés</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Raison</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucun mouvement enregistré
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            {format(new Date(movement.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMovementIcon(movement.type)}
                              <span>{movement.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{movement.productId}</TableCell>
                          <TableCell className="font-medium">{movement.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">{movement.reason || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sommiers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des sommiers</CardTitle>
                <CardDescription>Suivi des sommiers douaniers (entreposage fictif)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date d'ouverture</TableHead>
                      <TableHead>Articles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sommiers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucun sommier enregistré
                        </TableCell>
                      </TableRow>
                    ) : (
                      sommiers.map((sommier) => (
                        <TableRow key={sommier.id}>
                          <TableCell className="font-medium">{sommier.reference}</TableCell>
                          <TableCell>{sommier.supplierId}</TableCell>
                          <TableCell>
                            <Badge variant={sommier.status === "OPEN" ? "default" : "secondary"}>
                              {sommier.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(sommier.openedAt), "dd MMM yyyy", { locale: fr })}</TableCell>
                          <TableCell>{sommier.items.length}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau mouvement de stock</DialogTitle>
            <DialogDescription>Enregistrez une entrée, sortie ou ajustement de stock</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitMovement} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Produit *</Label>
              <Select
                value={movementForm.productId}
                onValueChange={(value) => setMovementForm({ ...movementForm, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nameFr} (Stock: {product.stockQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de mouvement *</Label>
              <Select
                value={movementForm.type}
                onValueChange={(value: any) => setMovementForm({ ...movementForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">Entrée</SelectItem>
                  <SelectItem value="EXIT">Sortie</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajustement</SelectItem>
                  <SelectItem value="WASTAGE">Perte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité *</Label>
              <Input
                id="quantity"
                type="number"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: Number.parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Raison</Label>
              <Input
                id="reason"
                value={movementForm.reason}
                onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                placeholder="Motif du mouvement"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMovementDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
