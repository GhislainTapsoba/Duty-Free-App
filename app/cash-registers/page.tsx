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
import type { CashRegister } from "@/lib/types"
import { Plus, DoorOpen, DoorClosed, Edit, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CashRegistersPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([])
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    location: "",
  })

  const [openingBalance, setOpeningBalance] = useState(0)
  const [closingNotes, setClosingNotes] = useState("")

  useEffect(() => {
    fetchRegisters()
  }, [])

  const fetchRegisters = async () => {
    try {
      const data = await apiClient.get<CashRegister[]>("/cash-registers")
      setRegisters(data)
    } catch (error) {
      console.error("Failed to fetch cash registers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRegister) {
        await apiClient.put(`/cash-registers/${editingRegister.id}`, formData)
        toast({ title: "Caisse modifiée", description: "Les informations ont été mises à jour" })
      } else {
        await apiClient.post("/cash-registers", formData)
        toast({ title: "Caisse créée", description: "La nouvelle caisse a été créée" })
      }
      fetchRegisters()
      handleCloseDialog()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la caisse",
        variant: "destructive",
      })
    }
  }

  const handleOpenRegister = async () => {
    if (!selectedRegister) return

    try {
      await apiClient.post(`/cash-registers/${selectedRegister.id}/open`, {
        openingBalance,
      })
      toast({
        title: "Caisse ouverte",
        description: "La caisse a été ouverte avec succès",
      })
      fetchRegisters()
      setShowOpenDialog(false)
      setOpeningBalance(0)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la caisse",
        variant: "destructive",
      })
    }
  }

  const handleCloseRegister = async () => {
    if (!selectedRegister) return

    try {
      await apiClient.post(`/cash-registers/${selectedRegister.id}/close`, {
        notes: closingNotes,
      })
      toast({
        title: "Caisse fermée",
        description: "La caisse a été fermée avec succès",
      })
      fetchRegisters()
      setShowCloseDialog(false)
      setClosingNotes("")
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de fermer la caisse",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (register: CashRegister) => {
    setEditingRegister(register)
    setFormData({
      name: register.name,
      location: register.location,
    })
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingRegister(null)
    setFormData({
      name: "",
      location: "",
    })
  }

  const openRegisters = registers.filter((r) => r.status === "OPEN")
  const closedRegisters = registers.filter((r) => r.status === "CLOSED")
  const totalBalance = openRegisters.reduce((sum, r) => sum + r.currentBalance, 0)

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Caisses</h1>
            <p className="text-muted-foreground mt-2">Gérez vos points de vente et caisses</p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle caisse
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Caisses ouvertes</CardTitle>
              <DoorOpen className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRegisters.length}</div>
              <p className="text-xs text-muted-foreground mt-1">En activité</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Caisses fermées</CardTitle>
              <DoorClosed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closedRegisters.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Inactives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde total</CardTitle>
              <DoorOpen className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBalance.toLocaleString()} XOF</div>
              <p className="text-xs text-muted-foreground mt-1">Caisses ouvertes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des caisses</CardTitle>
            <CardDescription>{registers.length} caisses au total</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Caissier</TableHead>
                  <TableHead>Solde actuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière activité</TableHead>
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
                ) : registers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune caisse trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  registers.map((register) => (
                    <TableRow key={register.id}>
                      <TableCell className="font-medium">{register.name}</TableCell>
                      <TableCell>{register.location}</TableCell>
                      <TableCell>{register.currentCashierId || "-"}</TableCell>
                      <TableCell className="font-medium">{register.currentBalance.toLocaleString()} XOF</TableCell>
                      <TableCell>
                        <Badge variant={register.status === "OPEN" ? "default" : "secondary"}>
                          {register.status === "OPEN" ? "Ouverte" : "Fermée"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {register.openedAt
                          ? format(new Date(register.openedAt), "dd MMM yyyy HH:mm", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRegister(register)
                              setShowDetailsDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(register)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {register.status === "CLOSED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRegister(register)
                                setShowOpenDialog(true)
                              }}
                            >
                              <DoorOpen className="h-3 w-3 mr-1" />
                              Ouvrir
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRegister(register)
                                setShowCloseDialog(true)
                              }}
                            >
                              <DoorClosed className="h-3 w-3 mr-1" />
                              Fermer
                            </Button>
                          )}
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRegister ? "Modifier la caisse" : "Nouvelle caisse"}</DialogTitle>
            <DialogDescription>
              {editingRegister ? "Modifiez les informations de la caisse" : "Créez une nouvelle caisse"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la caisse *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Caisse 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Emplacement *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Terminal A - Zone Départ"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">{editingRegister ? "Modifier" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Open Register Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ouvrir la caisse</DialogTitle>
            <DialogDescription>{selectedRegister?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="openingBalance">Solde d'ouverture (XOF)</Label>
              <Input
                id="openingBalance"
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number.parseFloat(e.target.value))}
                placeholder="Entrez le montant initial"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleOpenRegister}>Ouvrir la caisse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Register Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fermer la caisse</DialogTitle>
            <DialogDescription>
              {selectedRegister?.name} - Solde actuel: {selectedRegister?.currentBalance.toLocaleString()} XOF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="closingNotes">Notes de fermeture</Label>
              <Input
                id="closingNotes"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Remarques ou observations"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCloseRegister}>Fermer la caisse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la caisse</DialogTitle>
            <DialogDescription>{selectedRegister?.name}</DialogDescription>
          </DialogHeader>

          {selectedRegister && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Emplacement</p>
                  <p className="font-medium">{selectedRegister.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant={selectedRegister.status === "OPEN" ? "default" : "secondary"}>
                    {selectedRegister.status === "OPEN" ? "Ouverte" : "Fermée"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solde d'ouverture</p>
                  <p className="font-medium">{selectedRegister.openingBalance.toLocaleString()} XOF</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solde actuel</p>
                  <p className="font-medium">{selectedRegister.currentBalance.toLocaleString()} XOF</p>
                </div>
                {selectedRegister.openedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ouverte le</p>
                    <p className="font-medium">
                      {format(new Date(selectedRegister.openedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                )}
                {selectedRegister.closedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fermée le</p>
                    <p className="font-medium">
                      {format(new Date(selectedRegister.closedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
