import axios, { type AxiosInstance, type AxiosError } from "axios"
import type { Sale, Product } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Extract the data from the response
        return response.data?.data ? response.data.data : response.data
      },
      (error: AxiosError) => {
        const serverData = (error.response?.data as any) ?? null

        console.error("[API Error]", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          error: serverData,
        })

        // If unauthorized, clear token and force login redirect
        if (error.response?.status === 401) {
          this.clearToken()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }

        // Prefer server-provided message when available. Attach server data
        // to the thrown Error so callers can inspect the full payload.
        const errorMessage = serverData?.message || error.message || "An error occurred"
        const err = new Error(errorMessage)
        ;(err as any).status = error.response?.status
        ;(err as any).statusText = error.response?.statusText
        ;(err as any).server = serverData
        return Promise.reject(err)
      },
    )
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  private setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  private clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
    }
  }

  auth = {
    login: async (credentials: { username: string; password: string }) => {
      console.log("[v0] Login attempt with credentials:", { username: credentials.username })
      console.log("[v0] API URL:", API_BASE_URL)

      try {
        // The response interceptor unwraps the server response and returns either
        // the inner `data` object or the full response body. For login the
        // interceptor will return the inner payload (which contains `token`).
  const payload = (await this.client.post<any>("/auth/login", credentials)) as any
        console.log("[v0] Login response:", payload)

        if (!payload || !payload.token) {
          throw new Error("Invalid login response")
        }

        const { token, ...user } = payload
        this.setToken(token)
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user))
        }
        return payload
      } catch (error: any) {
        console.error("[v0] Login error:", error)
        console.error("[v0] Error response:", error.response?.data)
        console.error("[v0] Error status:", error.response?.status)
        throw error
      }
    },

    getCurrentUser: async () => {
      // Interceptor already unwraps the response so just return the payload
  const payload = (await this.client.get<any>("/auth/me")) as any
  return payload
    },

    logout: async () => {
      await this.client.post("/auth/logout")
      this.clearToken()
    },
  }

  cashRegisters = {
    create: async (data: { registerNumber: string; name: string; location?: string }) => {
      const params = new URLSearchParams()
      params.append("registerNumber", data.registerNumber)
      params.append("name", data.name)
      if (data.location) params.append("location", data.location)
  const response = await this.client.post<any>(`/cash-registers?${params}`)
  return response
    },

    open: async (cashRegisterId: number, openingBalance: number) => {
      const response = await this.client.post<any>(
        `/cash-registers/${cashRegisterId}/open?openingBalance=${openingBalance}`,
      )
      return response
    },

    close: async (cashRegisterId: number, closingBalance: number) => {
      const response = await this.client.post<any>(
        `/cash-registers/${cashRegisterId}/close?closingBalance=${closingBalance}`,
      )
      return response
    },

    addCash: async (cashRegisterId: number, amount: number) => {
      await this.client.post(`/cash-registers/${cashRegisterId}/add-cash?amount=${amount}`)
    },

    removeCash: async (cashRegisterId: number, amount: number) => {
      await this.client.post(`/cash-registers/${cashRegisterId}/remove-cash?amount=${amount}`)
    },

    getById: async (id: number) => {
  const response = await this.client.get<any>(`/cash-registers/${id}`)
  return response
    },

    getByNumber: async (registerNumber: string) => {
  const response = await this.client.get<any>(`/cash-registers/number/${registerNumber}`)
  return response
    },

    getAll: async () => {
  const response = await this.client.get<any>("/cash-registers")
  return response
    },

    getOpen: async () => {
  const response = await this.client.get<any>("/cash-registers/open")
  return response
    },

    deactivate: async (id: number) => {
      await this.client.post(`/cash-registers/${id}/deactivate`)
    },
  }

  customers = {
    create: async (customer: any) => {
      const response = await this.client.post<any>("/customers", customer)
      return response
    },

    update: async (id: number, customer: any) => {
      const response = await this.client.put<any>(`/customers/${id}`, customer)
      return response
    },

    getById: async (id: number) => {
      const response = await this.client.get<any>(`/customers/${id}`)
      return response
    },

    getByEmail: async (email: string) => {
      const response = await this.client.get<any>(`/customers/email/${email}`)
      return response
    },

    getByPhone: async (phone: string) => {
      const response = await this.client.get<any>(`/customers/phone/${phone}`)
      return response
    },

    getAll: async () => {
      const response = await this.client.get<any>("/customers")
      return response
    },

    search: async (query: string) => {
      const response = await this.client.get<any>(`/customers/search?query=${query}`)
      return response
    },

    getVIP: async () => {
      const response = await this.client.get<any>("/customers/vip")
      return response
    },

    delete: async (id: number) => {
      await this.client.delete(`/customers/${id}`)
    },
  }

  loyalty = {
    createCard: async (customerId: number, data?: any) => {
      const response = await this.client.post<any>(`/loyalty/customer/${customerId}`, data || {})
      return response
    },

    getByCardNumber: async (cardNumber: string) => {
      const response = await this.client.get<any>(`/loyalty/${cardNumber}`)
      return response
    },

    getByCustomer: async (customerId: number) => {
      const response = await this.client.get<any>(`/loyalty/customer/${customerId}`)
      return response
    },

    getExpiringCards: async (daysAhead = 30) => {
      const response = await this.client.get<any>(`/loyalty/expiring?daysAhead=${daysAhead}`)
      return response
    },

    addPoints: async (cardNumber: string, points: number) => {
      const response = await this.client.post<any>(`/loyalty/${cardNumber}/points/add?points=${points}`)
      return response
    },

    redeemPoints: async (cardNumber: string, points: number) => {
      const response = await this.client.post<any>(`/loyalty/${cardNumber}/points/redeem?points=${points}`)
      return response
    },

    addToWallet: async (cardNumber: string, amount: number) => {
      const response = await this.client.post<any>(`/loyalty/${cardNumber}/wallet/add?amount=${amount}`)
      return response
    },

    deductFromWallet: async (cardNumber: string, amount: number) => {
      const response = await this.client.post<any>(`/loyalty/${cardNumber}/wallet/deduct?amount=${amount}`)
      return response
    },

    renewCard: async (cardNumber: string) => {
      const response = await this.client.post<any>(`/loyalty/${cardNumber}/renew`)
      return response
    },

    deactivateCard: async (cardNumber: string) => {
      await this.client.post(`/loyalty/${cardNumber}/deactivate`)
    },
  }

  payments = {
    process: async (saleId: number, paymentRequest: any) => {
      const response = await this.client.post<any>(`/payments/sale/${saleId}`, paymentRequest)
      return response
    },

    getBySale: async (saleId: number) => {
      const response = await this.client.get<any>(`/payments/sale/${saleId}`)
      return response
    },

    getTotalPaid: async (saleId: number) => {
      const response = await this.client.get<any>(`/payments/sale/${saleId}/total`)
      return response
    },

    verify: async (paymentId: number) => {
      const response = await this.client.post<any>(`/payments/${paymentId}/verify`)
      return response
    },
  }

  products = {
    create: async (product: any) => {
      const response = await this.client.post<any>("/products", product)
      return response
    },

    update: async (id: number, product: any) => {
      const response = await this.client.put<any>(`/products/${id}`, product)
      return response
    },

    getById: async (id: number) => {
      const response = await this.client.get<any>(`/products/${id}`)
      return response
    },

    getBySku: async (sku: string) => {
      const response = await this.client.get<any>(`/products/sku/${sku}`)
      return response
    },

    getAll: async () => {
      const response = await this.client.get<any>("/products")
      return Array.isArray(response) ? response : []
    },

    getByBarcode: async (barcode: string) => {
      const response = await this.client.get<any>(`/products/barcode/${barcode}`)
      return response
    },

    search: async (query: string, page = 0, size = 20) => {
      const response = await this.client.get<any>(
        `/products/search?query=${query}&page=${page}&size=${size}`,
      )
      return response
    },

    getByCategory: async (categoryId: number) => {
      const response = await this.client.get<any>(`/products/category/${categoryId}`)
      return response
    },

    getLowStock: async () => {
      const response = await this.client.get<any>("/products/low-stock")
      return response
    },

    getNeedingReorder: async () => {
      const response = await this.client.get<any>("/products/reorder")
      return response
    },

    delete: async (id: number) => {
      await this.client.delete(`/products/${id}`)
    },
  }

  purchaseOrders = {
    create: async (order: any) => {
      const response = await this.client.post<any>("/purchase-orders", order)
      return response
    },

    update: async (id: number, order: any) => {
      const response = await this.client.put<any>(`/purchase-orders/${id}`, order)
      return response
    },

    confirm: async (id: number) => {
      const response = await this.client.post<any>(`/purchase-orders/${id}/confirm`)
      return response
    },

    receive: async (id: number, sommierNumber: string, location: string) => {
      const response = await this.client.post<any>(
        `/purchase-orders/${id}/receive?sommierNumber=${sommierNumber}&location=${location}`,
      )
      return response
    },

    cancel: async (id: number, reason: string) => {
      await this.client.post(`/purchase-orders/${id}/cancel?reason=${reason}`)
    },

    getById: async (id: number) => {
      const response = await this.client.get<any>(`/purchase-orders/${id}`)
      return response
    },

    getByNumber: async (orderNumber: string) => {
      const response = await this.client.get<any>(`/purchase-orders/number/${orderNumber}`)
      return response
    },

    getBySupplier: async (supplierId: number) => {
      const response = await this.client.get<any>(`/purchase-orders/supplier/${supplierId}`)
      return response
    },

    getByStatus: async (status: string) => {
      const response = await this.client.get<any>(`/purchase-orders/status/${status}`)
      return response
    },

    getOverdue: async () => {
      const response = await this.client.get<any>("/purchase-orders/overdue")
      return response
    },
  }

  reports = {
    generateSales: async (startDate: string, endDate: string) => {
      const response = await this.client.get<any>(
        `/reports/sales?startDate=${startDate}&endDate=${endDate}`,
      )
      return response
    },

    generateDailySales: async (date: string) => {
  const response = await this.client.get<any>(`/reports/sales/daily?date=${date}`)
  return response
    },

    generateCashier: async (cashierId: number, startDate: string, endDate: string) => {
      const response = await this.client.get<any>(
        `/reports/cashier/${cashierId}?startDate=${startDate}&endDate=${endDate}`,
      )
      return response
    },

    generateCashRegister: async (cashRegisterId: number, startDate: string, endDate: string) => {
      const response = await this.client.get<any>(
        `/reports/cash-register/${cashRegisterId}?startDate=${startDate}&endDate=${endDate}`,
      )
      return response
    },
  }

  sales = {
    create: async (sale: any) => {
      const response = await this.client.post<any>("/sales", sale)
      return response
    },

    complete: async (saleId: number) => {
      const response = await this.client.post<any>(`/sales/${saleId}/complete`)
      return response
    },

    cancel: async (saleId: number, reason: string) => {
      await this.client.post(`/sales/${saleId}/cancel?reason=${reason}`)
    },

    getById: async (id: number) => {
      const response = await this.client.get<any>(`/sales/${id}`)
      return response
    },

    getBySaleNumber: async (saleNumber: string) => {
      const response = await this.client.get<any>(`/sales/number/${saleNumber}`)
      return response
    },

    getByDateRange: async (startDate: string, endDate: string, page = 0, size = 20) => {
      const response = await this.client.get<any>(
        `/sales/date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}`,
      )
      return response
    },

    getAll: async () => {
      // On utilise la date du jour pour obtenir les ventes du jour
      const today = new Date()
      const startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)

      const response = await this.client.get<any>(
        `/sales/date-range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      return response || []
    },

    getByCashier: async (cashierId: number, startDate: string, endDate: string) => {
      const response = await this.client.get<any>(
        `/sales/cashier/${cashierId}?startDate=${startDate}&endDate=${endDate}`,
      )
      return response
    },

    getByCashRegister: async (cashRegisterId: number, startDate: string, endDate: string) => {
      const response = await this.client.get<any>(
        `/sales/cash-register/${cashRegisterId}?startDate=${startDate}&endDate=${endDate}`,
      )
      return response
    },
  }

  sommiers = {
    create: async (sommierNumber: string, initialValue: number, notes?: string) => {
      const params = new URLSearchParams()
      params.append("sommierNumber", sommierNumber)
      params.append("initialValue", initialValue.toString())
      if (notes) params.append("notes", notes)
      const response = await this.client.post<any>(`/sommiers?${params}`)
      return response
    },

    updateValue: async (sommierId: number, clearedAmount: number) => {
      const response = await this.client.put<any>(
        `/sommiers/${sommierId}/update-value?clearedAmount=${clearedAmount}`,
      )
      return response
    },

    close: async (sommierId: number) => {
      const response = await this.client.post<any>(`/sommiers/${sommierId}/close`)
      return response
    },

    getById: async (id: number) => {
      const response = await this.client.get<any>(`/sommiers/${id}`)
      return response
    },

    getByNumber: async (sommierNumber: string) => {
      const response = await this.client.get<any>(`/sommiers/number/${sommierNumber}`)
      return response
    },

    getActive: async () => {
      const response = await this.client.get<any>("/sommiers/active")
      return response
    },

    getByStatus: async (status: string) => {
      const response = await this.client.get<any>(`/sommiers/status/${status}`)
      return response
    },

    getAlerts: async () => {
      const response = await this.client.get<any>("/sommiers/alerts")
      return response
    },

    countActive: async () => {
      const response = await this.client.get<any>("/sommiers/count/active")
      return response
    },
  }

  stocks = {
    add: async (data: {
      productId: number
      sommierId?: number
      quantity: number
      location?: string
      lotNumber?: string
      expiryDate?: string
    }) => {
      const params = new URLSearchParams()
      params.append("productId", data.productId.toString())
      if (data.sommierId) params.append("sommierId", data.sommierId.toString())
      params.append("quantity", data.quantity.toString())
      if (data.location) params.append("location", data.location)
      if (data.lotNumber) params.append("lotNumber", data.lotNumber)
      if (data.expiryDate) params.append("expiryDate", data.expiryDate)
      const response = await this.client.post<any>(`/stocks?${params}`)
      return response
    },

    adjust: async (stockId: number, newQuantity: number) => {
      await this.client.put(`/stocks/${stockId}/adjust?newQuantity=${newQuantity}`)
    },

    reserve: async (productId: number, quantity: number) => {
      await this.client.post(`/stocks/${productId}/reserve?quantity=${quantity}`)
    },

    release: async (productId: number, quantity: number) => {
      await this.client.post(`/stocks/${productId}/release?quantity=${quantity}`)
    },

    getByProduct: async (productId: number) => {
      const response = await this.client.get<any>(`/stocks/product/${productId}`)
      return response
    },

    getTotalStock: async (productId: number) => {
      const response = await this.client.get<any>(`/stocks/product/${productId}/total`)
      return response
    },

    getAvailableStock: async (productId: number) => {
      const response = await this.client.get<any>(`/stocks/product/${productId}/available`)
      return response
    },

    getExpiring: async (daysAhead = 30) => {
      const response = await this.client.get<any>(`/stocks/expiring?daysAhead=${daysAhead}`)
      return response
    },

    getExpired: async () => {
      const response = await this.client.get<any>("/stocks/expired")
      return response
    },

    getLowStock: async (threshold = 10) => {
      const response = await this.client.get<any>(`/stocks/low?threshold=${threshold}`)
      return response
    },
  }

  sync = {
    synchronizeOfflineSales: async () => {
      await this.client.post("/sync/offline-sales")
    },

    getPendingCount: async () => {
      const response = await this.client.get<any>("/sync/pending-count")
      return response
    },

    hasPending: async () => {
      const response = await this.client.get<any>("/sync/has-pending")
      return response
    },

    getStatus: async () => {
      const response = await this.client.get<any>("/sync/status")
      return response
    },
  }

  wastages = {
    create: async (wastage: any) => {
      const response = await this.client.post<any>("/wastages", wastage)
      return response
    },

    getAll: async () => {
      const response = await this.client.get<any>("/wastages")
      return response
    },

    getByDateRange: async (startDate: string, endDate: string) => {
      const response = await this.client.get<any>(
        `/wastages/date-range?startDate=${startDate}&endDate=${endDate}`,
      )
      return response
    },

    getPending: async () => {
      const response = await this.client.get<any>("/wastages/pending")
      return response
    },

    approve: async (id: number) => {
      const response = await this.client.post<any>(`/wastages/${id}/approve`)
      return response
    },

    getTotalValueLost: async (startDate: string, endDate: string) => {
      const response = await this.client.get<any>(
        `/wastages/total-value-lost?startDate=${startDate}&endDate=${endDate}`,
      )
      return response
    },
  }

  // Legacy methods for backward compatibility
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint)
    return response as unknown as T
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data)
    return response as unknown as T
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, data)
    return response as unknown as T
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint)
    return response as unknown as T
  }
}

export const apiClient = new ApiClient()
