"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/api-client"
import type { Product, SaleItem } from "@/lib/types"
import type { ApiResponse } from "@/lib/api-client"
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const transformApiProduct = (apiProduct: any): Product => {
  return {
    id: apiProduct.id?.toString() || '',
    code: apiProduct.code || '',
    nameFr: apiProduct.nameFr || '',
    nameEn: apiProduct.nameEn || '',
    barcode: apiProduct.barcode || '',
    category: apiProduct.categoryName || '',
    priceXOF: apiProduct.sellingPriceXOF ? Number(apiProduct.sellingPriceXOF) : 0,
    priceEUR: apiProduct.sellingPriceEUR ? Number(apiProduct.sellingPriceEUR) : 0,
    priceUSD: apiProduct.sellingPriceUSD ? Number(apiProduct.sellingPriceUSD) : 0,
    taxRate: apiProduct.taxRate ? Number(apiProduct.taxRate) : 0,
    imageUrl: apiProduct.imageUrl || '',
    active: apiProduct.active ?? true,
    stockQuantity: apiProduct.currentStock ?? 0,
    minStockLevel: apiProduct.minStockLevel ?? 0,
  }
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currency, setCurrency] = useState<"XOF" | "EUR" | "USD">("XOF")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE_MONEY">("CASH")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Mettre à jour les prix du panier lorsque la devise change
  useEffect(() => {
    if (cart.length > 0) {
      const updatedCart = cart.map(item => {
        const product = products.find(p => p.id === item.productId)
        if (!product) return item

        const newPrice = currency === "XOF" 
          ? product.priceXOF ?? 0 
          : currency === "EUR" 
            ? product.priceEUR ?? 0 
            : product.priceUSD ?? 0

        return {
          ...item,
          unitPrice: newPrice,
          totalPrice: newPrice * item.quantity
        }
      })
      setCart(updatedCart)
    }
  }, [currency, products])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.products.getAll()
      setProducts(response || [])
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

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id)

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * (item.unitPrice ?? 0),
              }
            : item,
        ),
      )
    } else {
      const price = currency === "XOF" 
        ? product.priceXOF ?? 0 
        : currency === "EUR" 
          ? product.priceEUR ?? 0 
          : product.priceUSD ?? 0

      const newItem: SaleItem = {
        id: `temp-${Date.now()}`,
        productId: product.id,
        productName: product.nameFr,
        quantity: 1,
        unitPrice: price,
        taxRate: product.taxRate,
        discountPercent: 0,
        totalPrice: price,
      }
      setCart([...cart, newItem])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) return null
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            }
          }
          return item
        })
        .filter((item): item is SaleItem => item !== null),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const calculateTax = () => {
    return cart.reduce((sum, item) => sum + (item.totalPrice * item.taxRate) / 100, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des produits avant de procéder au paiement",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const saleData = {
        items: cart,
        currency,
        payments: [
          {
            method: paymentMethod,
            amount: calculateTotal(),
            currency,
          },
        ],
      }

      await apiClient.post("/sales", saleData)

      toast({
        title: "Vente enregistrée",
        description: "La transaction a été effectuée avec succès",
      })

      clearCart()
      setShowPaymentDialog(false)
    } catch (error) {
      console.error("Failed to process sale:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la vente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.nameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery),
  )

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR", "CASHIER"]}>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Products Section */}
        <div className="flex-1 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Point de vente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit (nom, code-barres)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">XOF</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => {
                    console.log("Product prices:", {
                      id: product.id,
                      name: product.nameFr,
                      XOF: product.priceXOF,
                      EUR: product.priceEUR,
                      USD: product.priceUSD
                    })
                    const price = currency === "XOF" 
                      ? product.priceXOF ?? 0
                      : currency === "EUR" 
                        ? product.priceEUR ?? 0 
                        : product.priceUSD ?? 0

                    return (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl || "/placeholder.svg"}
                                alt={product.nameFr}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <span className="text-4xl text-muted-foreground">📦</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm line-clamp-2">{product.nameFr}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">
                              {price?.toLocaleString() || '0'} {currency}
                            </span>
                            <Badge variant={product.stockQuantity > 0 ? "default" : "destructive"} className="text-xs">
                              {product.stockQuantity}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <Card className="w-96 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Panier</CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vider
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 -mx-6 px-6">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Panier vide</p>
                  <p className="text-sm mt-2">Ajoutez des produits pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <Card key={item.productId}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">{item.productName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(item.unitPrice ?? 0).toLocaleString()} {currency}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => updateQuantity(item.productId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => updateQuantity(item.productId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold">
                            {(item.totalPrice ?? 0).toLocaleString()} {currency}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>
                    {calculateSubtotal().toLocaleString()} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span>
                    {calculateTax().toLocaleString()} {currency}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {calculateTotal().toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setShowPaymentDialog(true)}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Procéder au paiement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paiement</DialogTitle>
            <DialogDescription>Sélectionnez le mode de paiement</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === "CASH" ? "default" : "outline"}
                  className="flex flex-col h-auto py-4"
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote className="h-6 w-6 mb-2" />
                  <span className="text-xs">Espèces</span>
                </Button>
                <Button
                  variant={paymentMethod === "CARD" ? "default" : "outline"}
                  className="flex flex-col h-auto py-4"
                  onClick={() => setPaymentMethod("CARD")}
                >
                  <CreditCard className="h-6 w-6 mb-2" />
                  <span className="text-xs">Carte</span>
                </Button>
                <Button
                  variant={paymentMethod === "MOBILE_MONEY" ? "default" : "outline"}
                  className="flex flex-col h-auto py-4"
                  onClick={() => setPaymentMethod("MOBILE_MONEY")}
                >
                  <Smartphone className="h-6 w-6 mb-2" />
                  <span className="text-xs">Mobile Money</span>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Montant à payer</span>
                <span className="text-primary">
                  {calculateTotal().toLocaleString()} {currency}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleCheckout} disabled={loading}>
              {loading ? "Traitement..." : "Confirmer le paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
