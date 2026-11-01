// NeuroVector API (openapi 3.1.0) 의 스키마를 그대로 옮긴 타입.
// /api-docs/openapi.json 기준.

export interface AdminSessionInfo {
  username: string
  expires_at: string
}

export interface AdminOrderStats {
  total_orders: number
  pending_payment: number
  paid: number
  preparing: number
  ready: number
  assigned: number
  in_transit: number
  delivered: number
  cancelled: number
  failed: number
  today_orders: number
  revenue: number
  delivered_revenue: number
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  status: string
  total_amount: number
  currency: string
  delivery_address: string
  delivery_detail?: string | null
  delivery_id?: string | null
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
  stock_restored_at?: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  provider: string
  method: string
  status: string
  amount: number
  currency: string
  transaction_id?: string | null
  failure_reason?: string | null
  created_at: string
  updated_at: string
}

export interface OrderDetail extends Order {
  items: OrderItem[]
  payment?: Payment | null
}

export interface AdminOrderList {
  items: Order[]
  total: number
  limit: number
  offset: number
}

export interface OrderEvent {
  event_id: string
  event_type: string
  payload: Record<string, unknown>
  order_id?: string | null
  job_id?: string | null
  created_at: string
}

export interface OrderJob {
  id: string
  status: string
  payload: Record<string, unknown>
  attempts: number
  max_attempts: number
  order_id?: string | null
  started_at?: string | null
  completed_at?: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface QueueStats {
  jobs: { status: string; count: number }[]
  events: number
  consumer_offsets: {
    consumer: string
    topic: string
    partition: number
    next_offset: number
    updated_at: string
  }[]
}

export interface InventoryItem {
  id: string
  sku: string
  name: string
  description?: string | null
  unit_price: number
  currency: string
  stock_quantity: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateItem {
  sku: string
  name: string
  unit_price: number
  currency?: string | null
  description?: string | null
  stock_quantity?: number | null
  active?: boolean
}

export type UpdateItem = Partial<Omit<CreateItem, 'sku'>>

export interface ReadinessResponse {
  status: string
  postgres: string
  redis: string
}

// /api/v1/flights · /api/v1/deliveries 는 OpenAPI 문서에 없고 현재 서버가 빈 배열을 돌려준다.
// 필드 이름을 확정할 수 없어 느슨하게 받고 normalizeDrone() 에서 추려 쓴다.
export type UnknownRecord = Record<string, unknown>
