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
import type { Product } from "@/lib/types"
import type { ApiResponse } from "@/lib/api-client"
import { Search, Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    code: "",
    barcode: "",
    nameFr: "",
    nameEn: "",
    descriptionFr: "",
    descriptionEn: "",
    category: "",
    priceXOF: 0,
    priceEUR: 0,
    priceUSD: 0,
    taxRate: 18,
    minStockLevel: 10,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get<ApiResponse<Product[]>>("/products")
      
      // Log the raw response for debugging
      console.log("API Response:", response)
      
      // Handle both direct array response and wrapped response
      const productsData = Array.isArray(response) 
        ? response 
        : (response as ApiResponse<Product[]>).data
      
      // Validate that we have an array
      if (!Array.isArray(productsData)) {
        console.error("Invalid products data format:", productsData)
        setProducts([])
        toast({
          title: "Erreur",
          description: "Format de données invalide",
          variant: "destructive",
        })
        return
      }

      setProducts(productsData)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, formData)
        toast({ title: "Produit modifié", description: "Le produit a été mis à jour avec succès" })
      } else {
        await apiClient.post("/products", formData)
        toast({ title: "Produit ajouté", description: "Le nouveau produit a été créé avec succès" })
      }
      fetchProducts()
      handleCloseDialog()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le produit",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      code: product.code,
      barcode: product.barcode || "",
      nameFr: product.nameFr,
      nameEn: product.nameEn,
      descriptionFr: product.descriptionFr || "",
      descriptionEn: product.descriptionEn || "",
      category: product.category,
      priceXOF: product.priceXOF ?? 0,
      priceEUR: product.priceEUR ?? 0,
      priceUSD: product.priceUSD ?? 0,
      taxRate: product.taxRate,
      minStockLevel: product.minStockLevel,
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await apiClient.delete(`/products/${id}`)
        toast({ title: "Produit supprimé", description: "Le produit a été supprimé avec succès" })
        fetchProducts()
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le produit",
          variant: "destructive",
        })
      }
    }
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingProduct(null)
    setFormData({
      code: "",
      barcode: "",
      nameFr: "",
      nameEn: "",
      descriptionFr: "",
      descriptionEn: "",
      category: "",
      priceXOF: 0,
      priceEUR: 0,
      priceUSD: 0,
      taxRate: 18,
      minStockLevel: 10,
    })
  }

  const filteredProducts = products.filter(
    (product) =>
      product.nameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR", "STOCK_MANAGER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground mt-2">Gérez votre catalogue de produits</p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Catalogue</CardTitle>
                <CardDescription>{products.length} produits au total</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
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
                  <TableHead>Code</TableHead>
                  <TableHead>Nom (FR)</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix XOF</TableHead>
                  <TableHead>Prix EUR</TableHead>
                  <TableHead>Prix USD</TableHead>
                  <TableHead>Stock</TableHead>
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
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.code}</TableCell>
                      <TableCell>{product.nameFr}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{(product.priceXOF ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{(product.priceEUR ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{(product.priceUSD ?? 0).toLocaleString()}</TableCell>
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
                          {product.stockQuantity <= product.minStockLevel && <AlertCircle className="h-3 w-3 mr-1" />}
                          {product.stockQuantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
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

      {/* Product Form Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifiez les informations du produit" : "Ajoutez un nouveau produit au catalogue"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code produit *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Code-barres</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameFr">Nom (Français) *</Label>
                <Input
                  id="nameFr"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">Nom (Anglais) *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alcool">Alcool</SelectItem>
                  <SelectItem value="Parfums">Parfums</SelectItem>
                  <SelectItem value="Cosmétiques">Cosmétiques</SelectItem>
                  <SelectItem value="Tabac">Tabac</SelectItem>
                  <SelectItem value="Confiserie">Confiserie</SelectItem>
                  <SelectItem value="Accessoires">Accessoires</SelectItem>
                  <SelectItem value="Électronique">Électronique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceXOF">Prix XOF *</Label>
                <Input
                  id="priceXOF"
                  type="number"
                  value={formData.priceXOF}
                  onChange={(e) => setFormData({ ...formData, priceXOF: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceEUR">Prix EUR *</Label>
                <Input
                  id="priceEUR"
                  type="number"
                  step="0.01"
                  value={formData.priceEUR}
                  onChange={(e) => setFormData({ ...formData, priceEUR: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceUSD">Prix USD *</Label>
                <Input
                  id="priceUSD"
                  type="number"
                  step="0.01"
                  value={formData.priceUSD}
                  onChange={(e) => setFormData({ ...formData, priceUSD: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Niveau de stock minimum</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">{editingProduct ? "Modifier" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
