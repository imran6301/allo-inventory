export interface Warehouse {
  id: string
  name: string
  location: string
}

export interface Stock {
  id: string
  productId: string
  warehouseId: string
  warehouse: Warehouse
  total: number
  reserved: number
  available: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  stocks: Stock[]
}

export interface Reservation {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  status: 'pending' | 'confirmed' | 'released'
  expiresAt: string
  product: Product
}