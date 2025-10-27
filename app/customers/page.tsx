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
import { apiClient } from "@/lib/api-client"
import type { Customer } from "@/lib/types"
import { Search, Plus, Edit, Eye, CreditCard, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    flightInfo: {
      airline: "",
      flightNumber: "",
      destination: "",
      departureTime: "",
    },
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const data = await apiClient.get<Customer[]>("/customers")
      setCustomers(data)
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await apiClient.put(`/customers/${editingCustomer.id}`, formData)
        toast({ title: "Client modifié", description: "Les informations ont été mises à jour" })
      } else {
        await apiClient.post("/customers", formData)
        toast({ title: "Client ajouté", description: "Le nouveau client a été créé" })
      }
      fetchCustomers()
      handleCloseDialog()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le client",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || "",
      phone: customer.phone || "",
      flightInfo: customer.flightInfo || {
        airline: "",
        flightNumber: "",
        destination: "",
        departureTime: "",
      },
    })
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingCustomer(null)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      flightInfo: {
        airline: "",
        flightNumber: "",
        destination: "",
        departureTime: "",
      },
    })
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.loyaltyCardNumber?.includes(searchQuery),
  )

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-2">Gérez votre base de données clients</p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total clients</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Clients enregistrés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cartes fidélité</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.filter((c) => c.loyaltyCardNumber).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Clients fidèles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points totaux</CardTitle>
              <Award className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Points de fidélité</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des clients</CardTitle>
                <CardDescription>{customers.length} clients au total</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Carte fidélité</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Wallet</TableHead>
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
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun client trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>
                        {customer.loyaltyCardNumber ? (
                          <Badge variant="default">{customer.loyaltyCardNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{customer.loyaltyPoints} pts</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{customer.walletBalance.toLocaleString()} XOF</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setShowDetailsDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4" />
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

      {/* Customer Form Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Modifiez les informations du client" : "Ajoutez un nouveau client"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Informations de vol</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="airline">Compagnie aérienne</Label>
                  <Input
                    id="airline"
                    value={formData.flightInfo.airline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        flightInfo: { ...formData.flightInfo, airline: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightNumber">Numéro de vol</Label>
                  <Input
                    id="flightNumber"
                    value={formData.flightInfo.flightNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        flightInfo: { ...formData.flightInfo, flightNumber: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.flightInfo.destination}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        flightInfo: { ...formData.flightInfo, destination: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Heure de départ</Label>
                  <Input
                    id="departureTime"
                    type="datetime-local"
                    value={formData.flightInfo.departureTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        flightInfo: { ...formData.flightInfo, departureTime: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">{editingCustomer ? "Modifier" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du client</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedCustomer.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carte fidélité</p>
                  <p className="font-medium">{selectedCustomer.loyaltyCardNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points de fidélité</p>
                  <p className="font-medium">{selectedCustomer.loyaltyPoints} points</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solde wallet</p>
                  <p className="font-medium">{selectedCustomer.walletBalance.toLocaleString()} XOF</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Membre depuis</p>
                  <p className="font-medium">
                    {format(new Date(selectedCustomer.createdAt), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>

              {selectedCustomer.flightInfo && (
                <div>
                  <h4 className="font-semibold mb-3">Informations de vol</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Compagnie</p>
                      <p className="font-medium">{selectedCustomer.flightInfo.airline}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Numéro de vol</p>
                      <p className="font-medium">{selectedCustomer.flightInfo.flightNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{selectedCustomer.flightInfo.destination}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Départ</p>
                      <p className="font-medium">
                        {format(new Date(selectedCustomer.flightInfo.departureTime), "dd MMM yyyy HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
