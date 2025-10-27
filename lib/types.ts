// User roles
export type UserRole = "ADMIN" | "SUPERVISOR" | "CASHIER" | "STOCK_MANAGER"

// User type
export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  active: boolean
  createdAt: string
}

// Auth types
export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Product types
export interface Product {
  id: string
  code: string
  barcode?: string
  nameFr: string
  nameEn: string
  descriptionFr?: string
  descriptionEn?: string
  category: string
  priceXOF: number | null
  priceEUR: number | null
  priceUSD: number | null
  taxRate: number
  imageUrl?: string
  active: boolean
  stockQuantity: number
  minStockLevel: number
}

// Stock types
export interface StockMovement {
  id: string
  productId: string
  type: "ENTRY" | "EXIT" | "ADJUSTMENT" | "WASTAGE"
  quantity: number
  reason?: string
  sommierId?: string
  userId: string
  createdAt: string
}

export interface Sommier {
  id: string
  reference: string
  supplierId: string
  status: "OPEN" | "CLOSED"
  openedAt: string
  closedAt?: string
  items: SommierItem[]
}

export interface SommierItem {
  id: string
  productId: string
  quantity: number
  remainingQuantity: number
}

// Sale types
export interface Sale {
  id: string
  saleNumber: string
  cashRegisterId: string
  cashierId: string
  customerId?: string
  items: SaleItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency: "XOF" | "EUR" | "USD"
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  payments: Payment[]
  createdAt: string
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  taxRate: number
  discountPercent: number
  totalPrice: number
}

// Payment types
export interface Payment {
  id: string
  saleId: string
  method: "CASH" | "CARD" | "MOBILE_MONEY"
  amount: number
  currency: "XOF" | "EUR" | "USD"
  reference?: string
  status: "PENDING" | "COMPLETED" | "FAILED"
  createdAt: string
}

// Customer types
export interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  loyaltyCardNumber?: string
  loyaltyPoints: number
  walletBalance: number
  flightInfo?: FlightInfo
  createdAt: string
}

export interface FlightInfo {
  airline: string
  flightNumber: string
  destination: string
  departureTime: string
}

// Cash register types
export interface CashRegister {
  id: string
  name: string
  location: string
  status: "OPEN" | "CLOSED"
  currentCashierId?: string
  openingBalance: number
  currentBalance: number
  openedAt?: string
  closedAt?: string
}

// Purchase order types
export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  status: "DRAFT" | "SENT" | "RECEIVED" | "COMPLETED"
  items: PurchaseOrderItem[]
  subtotal: number
  shippingCost: number
  insuranceCost: number
  totalCost: number
  createdAt: string
  receivedAt?: string
}

export interface PurchaseOrderItem {
  id: string
  productId: string
  quantity: number
  unitCost: number
  totalCost: number
}

// Supplier types
export interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  active: boolean
}

// Report types
export interface SalesReport {
  period: string
  totalSales: number
  totalRevenue: number
  averageTicket: number
  topProducts: ProductSalesData[]
  salesByCategory: CategorySalesData[]
  salesByPaymentMethod: PaymentMethodData[]
}

export interface ProductSalesData {
  productId: string
  productName: string
  quantity: number
  revenue: number
}

export interface CategorySalesData {
  category: string
  quantity: number
  revenue: number
}

export interface PaymentMethodData {
  method: string
  count: number
  amount: number
}
