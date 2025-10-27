"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import type { Payment } from "@/lib/types"
import { Search, CreditCard, Banknote, Smartphone, CheckCircle, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const data = await apiClient.get<Payment[]>("/payments")
      setPayments(data)
    } catch (error) {
      console.error("Failed to fetch payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.saleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return <Banknote className="h-4 w-4" />
      case "CARD":
        return <CreditCard className="h-4 w-4" />
      case "MOBILE_MONEY":
        return <Smartphone className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      COMPLETED: { variant: "default" as const, icon: CheckCircle, label: "Complété" },
      PENDING: { variant: "secondary" as const, icon: Clock, label: "En attente" },
      FAILED: { variant: "destructive" as const, icon: XCircle, label: "Échoué" },
    }
    const { variant, icon: Icon, label } = config[status as keyof typeof config] || config.PENDING
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const totalAmount = payments.reduce((sum, p) => (p.status === "COMPLETED" ? sum + p.amount : sum), 0)
  const completedPayments = payments.filter((p) => p.status === "COMPLETED").length
  const pendingPayments = payments.filter((p) => p.status === "PENDING").length

  return (
    <DashboardLayout allowedRoles={["ADMIN", "SUPERVISOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
          <p className="text-muted-foreground mt-2">Suivez toutes les transactions de paiement</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total encaissé</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAmount.toLocaleString()} XOF</div>
              <p className="text-xs text-muted-foreground mt-1">Paiements complétés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Complétés</CardTitle>
              <CheckCircle className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">Transactions réussies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">À traiter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
              <CheckCircle className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.length > 0 ? Math.round((completedPayments / payments.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Paiements réussis</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historique des paiements</CardTitle>
                <CardDescription>Toutes les transactions de paiement</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par vente ou référence..."
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
                  <TableHead>Date</TableHead>
                  <TableHead>Vente</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun paiement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}</TableCell>
                      <TableCell className="font-medium">{payment.saleId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(payment.method)}
                          <span>{payment.method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.currency}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.reference || "-"}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
