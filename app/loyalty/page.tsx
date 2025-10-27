"use client"

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
import { apiClient } from "@/lib/api-client"
import type { Customer } from "@/lib/types"
import { Award, TrendingUp, Gift, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showPointsDialog, setShowPointsDialog] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [pointsAmount, setPointsAmount] = useState(0)
  const [walletAmount, setWalletAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const data = await apiClient.get<Customer[]>("/customers")
      setCustomers(data.filter((c) => c.loyaltyCardNumber))
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPoints = async () => {
    if (!selectedCustomer) return

    try {
      await apiClient.post(`/loyalty/${selectedCustomer.id}/points`, {
        points: pointsAmount,
      })
      toast({
        title: "Points ajoutés",
        description: `${pointsAmount} points ont été ajoutés au compte`,
      })
      fetchCustomers()
      setShowPointsDialog(false)
      setPointsAmount(0)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les points",
        variant: "destructive",
      })
    }
  }

  const handleAddWallet = async () => {
    if (!selectedCustomer) return

    try {
      await apiClient.post(`/loyalty/${selectedCustomer.id}/wallet`, {
        amount: walletAmount,
      })
      toast({
        title: "Wallet rechargé",
        description: `${walletAmount} XOF ont été ajoutés au wallet`,
      })
      fetchCustomers()
      setShowWalletDialog(false)
      setWalletAmount(0)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de recharger le wallet",
        variant: "destructive",
      })
    }
  }

  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)
  const totalWallet = customers.reduce((sum, c) => sum + c.walletBalance, 0)

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programme de fidélité</h1>
          <p className="text-muted-foreground mt-2">Gérez les points et wallets de vos clients fidèles</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Clients fidèles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points totaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Points en circulation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet total</CardTitle>
              <Wallet className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWallet.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">XOF en wallets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne points</CardTitle>
              <Gift className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.length > 0 ? Math.round(totalPoints / customers.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Points par membre</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Membres</TabsTrigger>
            <TabsTrigger value="rewards">Récompenses</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membres du programme</CardTitle>
                <CardDescription>Tous les clients avec carte de fidélité</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Carte fidélité</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucun membre trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">{customer.loyaltyCardNumber}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{customer.loyaltyPoints} pts</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{customer.walletBalance.toLocaleString()} XOF</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowPointsDialog(true)
                                }}
                              >
                                <Award className="h-3 w-3 mr-1" />
                                Points
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowWalletDialog(true)
                                }}
                              >
                                <Wallet className="h-3 w-3 mr-1" />
                                Wallet
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
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Catalogue de récompenses</CardTitle>
                <CardDescription>Récompenses disponibles pour les membres</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Le catalogue de récompenses sera disponible prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des transactions</CardTitle>
                <CardDescription>Historique des points et wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>L'historique des transactions sera disponible prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des points</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.firstName} {selectedCustomer?.lastName} - {selectedCustomer?.loyaltyPoints} points
              actuels
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="points">Nombre de points</Label>
              <Input
                id="points"
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(Number.parseInt(e.target.value))}
                placeholder="Entrez le nombre de points"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPointsDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddPoints} disabled={pointsAmount <= 0}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Wallet Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recharger le wallet</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.firstName} {selectedCustomer?.lastName} -{" "}
              {selectedCustomer?.walletBalance.toLocaleString()} XOF actuels
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (XOF)</Label>
              <Input
                id="amount"
                type="number"
                value={walletAmount}
                onChange={(e) => setWalletAmount(Number.parseFloat(e.target.value))}
                placeholder="Entrez le montant"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWalletDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddWallet} disabled={walletAmount <= 0}>
              Recharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
