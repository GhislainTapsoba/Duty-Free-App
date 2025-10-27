"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import type { PurchaseOrder, Supplier, Product } from "@/lib/types"
import { Plus, Eye, Trash2, ShoppingCart } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    supplierId: "",
    shippingCost: 0,
    insuranceCost: 0,
    items: [] as Array<{ productId: string; quantity: number; unitCost: number }>,
  })

  useEffect(() => {
    fetchOrders()
    fetchSuppliers()
    fetchProducts()
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await apiClient.get<PurchaseOrder[]>("/purchase-orders")
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const data = await apiClient.get<Supplier[]>("/suppliers")
      setSuppliers(data)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const data = await apiClient.get<Product[]>("/products")
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.items.length === 0) {
      toast({
        title: "Erreur",
        description: "Ajoutez au moins un article à la commande",
        variant: "destructive",
      })
      return
    }

    try {
      await apiClient.post("/purchase-orders", formData)
      toast({ title: "Commande créée", description: "La commande fournisseur a été créée avec succès" })
      fetchOrders()
      handleCloseDialog()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive",
      })
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, unitCost: 0 }],
    })
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setFormData({
      supplierId: "",
      shippingCost: 0,
      insuranceCost: 0,
      items: [],
    })
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + formData.shippingCost + formData.insuranceCost
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      DRAFT: "outline",
      SENT: "secondary",
      RECEIVED: "default",
      COMPLETED: "default",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR", "STOCK_MANAGER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commandes fournisseurs</h1>
            <p className="text-muted-foreground mt-2">Gérez vos commandes et approvisionnements</p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle commande
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === "DRAFT").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === "SENT").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reçues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === "RECEIVED").length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des commandes</CardTitle>
            <CardDescription>Toutes vos commandes fournisseurs</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Montant total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.supplierId}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), "dd MMM yyyy", { locale: fr })}</TableCell>
                      <TableCell>{order.items.length}</TableCell>
                      <TableCell className="font-medium">{order.totalCost.toLocaleString()} XOF</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Order Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle commande fournisseur</DialogTitle>
            <DialogDescription>Créez une nouvelle commande d'approvisionnement</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fournisseur *</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Articles de la commande *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un article
                </Button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-5 space-y-2">
                          <Label>Produit</Label>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => handleItemChange(index, "productId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un produit" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.nameFr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value))}
                          />
                        </div>
                        <div className="col-span-3 space-y-2">
                          <Label>Prix unitaire</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => handleItemChange(index, "unitCost", Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="col-span-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Total: {(item.quantity * item.unitCost).toLocaleString()} XOF
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingCost">Frais de transport</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  min="0"
                  value={formData.shippingCost}
                  onChange={(e) => setFormData({ ...formData, shippingCost: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceCost">Frais d'assurance</Label>
                <Input
                  id="insuranceCost"
                  type="number"
                  min="0"
                  value={formData.insuranceCost}
                  onChange={(e) => setFormData({ ...formData, insuranceCost: Number.parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total:</span>
                  <span className="font-medium">{calculateSubtotal().toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frais de transport:</span>
                  <span className="font-medium">{formData.shippingCost.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frais d'assurance:</span>
                  <span className="font-medium">{formData.insuranceCost.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{calculateTotal().toLocaleString()} XOF</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">Créer la commande</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>{selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-medium">{selectedOrder.supplierId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de création</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.createdAt), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                {selectedOrder.receivedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date de réception</p>
                    <p className="font-medium">
                      {format(new Date(selectedOrder.receivedAt), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">Articles commandés</h4>
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
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productId}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitCost.toLocaleString()} XOF</TableCell>
                        <TableCell className="text-right font-medium">{item.totalCost.toLocaleString()} XOF</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total:</span>
                  <span className="font-medium">{selectedOrder.subtotal.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de transport:</span>
                  <span className="font-medium">{selectedOrder.shippingCost.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais d'assurance:</span>
                  <span className="font-medium">{selectedOrder.insuranceCost.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{selectedOrder.totalCost.toLocaleString()} XOF</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
