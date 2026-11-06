import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api } from './client'
import { clearAdminSession } from './session'
import { droneTelemetryListSchema } from '../lib/drones'
import type {
  AdminOrderList,
  AdminOrderStats,
  AdminSessionInfo,
  CreateItem,
  InventoryItem,
  OrderDetail,
  OrderEvent,
  OrderJob,
  QueueStats,
  ReadinessResponse,
  UnknownRecord,
  UpdateItem,
} from './types'

const ADMIN = '/api/v1/admin'

/* ---------- auth ---------- */

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: () => api<AdminSessionInfo>(`${ADMIN}/auth/me`),
    retry: false,
    staleTime: 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { username: string; password: string }) => {
      await api<AdminSessionInfo>(`${ADMIN}/auth/login`, { method: 'POST', body })
      try {
        return await api<AdminSessionInfo>(`${ADMIN}/auth/me`)
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error
        throw new ApiError(
          401,
          '관리자 세션을 유지하지 못했습니다. 페이지를 새로고침한 뒤 다시 로그인해 주세요.',
        )
      }
    },
    onSuccess: (session) => {
      qc.setQueryData(['session'], session)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<unknown>(`${ADMIN}/auth/logout`, { method: 'POST' }),
    onSuccess: () => clearAdminSession(qc),
  })
}

/* ---------- orders ---------- */

export function useOrderStats() {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: () => api<AdminOrderStats>(`${ADMIN}/orders/stats`),
    refetchInterval: 30_000,
  })
}

export function useOrders(params: { status?: string; limit?: number; offset?: number } = {}) {
  const { status, limit = 20, offset = 0 } = params
  return useQuery({
    queryKey: ['orders', status ?? 'all', limit, offset],
    queryFn: () => api<AdminOrderList>(`${ADMIN}/orders`, { query: { status, limit, offset } }),
    refetchInterval: 30_000,
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api<OrderDetail>(`/api/v1/orders/${id}`),
    enabled: Boolean(id),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<OrderDetail>(`/api/v1/orders/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['order', id] })
      void qc.invalidateQueries({ queryKey: ['order-stats'] })
      void qc.invalidateQueries({ queryKey: ['order-events'] })
    },
  })
}

export function useOrderEvents(limit = 20) {
  return useQuery({
    queryKey: ['order-events', limit],
    queryFn: () => api<OrderEvent[]>(`${ADMIN}/order-events`, { query: { limit } }),
    refetchInterval: 30_000,
  })
}

export function useOrderJobs(limit = 50) {
  return useQuery({
    queryKey: ['order-jobs', limit],
    queryFn: () => api<OrderJob[]>(`${ADMIN}/order-jobs`, { query: { limit } }),
    refetchInterval: 30_000,
  })
}

export function useRetryJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<OrderJob>(`${ADMIN}/order-jobs/${id}/retry`, { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['order-jobs'] }),
  })
}

export function useCancelJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<OrderJob>(`${ADMIN}/order-jobs/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['order-jobs'] }),
  })
}

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => api<QueueStats>(`${ADMIN}/queue/stats`),
    refetchInterval: 30_000,
  })
}

export function useReadiness() {
  return useQuery({
    queryKey: ['readiness'],
    queryFn: () => api<ReadinessResponse>('/health/ready'),
    refetchInterval: 60_000,
  })
}

/* ---------- inventory ---------- */

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => api<InventoryItem[]>('/api/v1/inventory'),
  })
}

export function useInventoryItem(id: string | undefined) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => api<InventoryItem>(`/api/v1/inventory/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateItem) =>
      api<InventoryItem>('/api/v1/inventory', { method: 'POST', body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateItem }) =>
      api<InventoryItem>(`/api/v1/inventory/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useRestockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api<InventoryItem>(`/api/v1/inventory/${id}/restock`, { method: 'POST', body: { quantity } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

/* ---------- 드론 (flights · deliveries) ---------- */

export function useFlights() {
  return useQuery({
    queryKey: ['flights'],
    queryFn: async () => droneTelemetryListSchema.parse(await api<unknown>('/api/v1/flights/status')),
    refetchInterval: 10_000,
  })
}

export function useDeliveries() {
  return useQuery({
    queryKey: ['deliveries'],
    queryFn: () => api<UnknownRecord[]>('/api/v1/deliveries'),
    refetchInterval: 10_000,
  })
}

export function useDetections() {
  return useQuery({
    queryKey: ['detections'],
    queryFn: () => api<UnknownRecord[]>('/api/v1/detections'),
    refetchInterval: 30_000,
  })
}

export function useProductPhotos() {
  return useQuery({
    queryKey: ['product-photos'],
    queryFn: () => api<{ item_id: string; version: string; mime: string }[]>('/api/v1/inventory/photos'),
  })
}

export function useUploadProductPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, image_data_url }: { id: string; image_data_url: string }) =>
      api<unknown>(`/api/v1/inventory/${encodeURIComponent(id)}/photo`, { method: 'POST', body: { image_data_url } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['product-photos'] }),
  })
}
