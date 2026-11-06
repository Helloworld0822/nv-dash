import { z } from 'zod'

export type DroneStatus = 'in_transit' | 'idle' | 'charging' | 'maintenance' | 'offline'

export interface Drone {
  id: string
  name: string
  status: DroneStatus
  battery: number | null
  place: string | null
  orderNumber: string | null
  lastSeen: string | null
  linkOk: boolean
}

// backend/src/routes/flights.rs::DroneStatus
export const droneTelemetrySchema = z.object({
  drone_id: z.string().min(1), online: z.boolean(), last_seen: z.string(),
  battery_pct: z.number().nullable(), status: z.string().nullable(),
  flight_status: z.string().nullable(), delivery_id: z.string().nullable(),
})
export const droneTelemetryListSchema = z.array(droneTelemetrySchema)
export type DroneTelemetry = z.infer<typeof droneTelemetrySchema>

export const DRONE_STATUS_LABEL: Record<DroneStatus, string> = {
  in_transit: '배송 중', idle: '대기', charging: '충전 중', maintenance: '점검 필요', offline: '연결 끊김',
}

export function normalizeDrone(raw: DroneTelemetry): Drone {
  let status: DroneStatus = 'idle'
  if (!raw.online) status = 'offline'
  else if (raw.status === 'charging') status = 'charging'
  else if (['maintenance', 'fault', 'error'].includes(raw.status ?? '')) status = 'maintenance'
  else if (['in_flight', 'dispatched'].includes(raw.flight_status ?? '') || ['flying', 'in_transit', 'airborne'].includes(raw.status ?? '')) status = 'in_transit'
  return {
    id: raw.drone_id, name: raw.drone_id, status,
    battery: raw.battery_pct === null ? null : Math.round(raw.battery_pct),
    place: null, orderNumber: null, lastSeen: raw.last_seen, linkOk: raw.online,
  }
}

export function countByStatus(drones: Drone[]) {
  const counts: Record<DroneStatus, number> = { in_transit: 0, idle: 0, charging: 0, maintenance: 0, offline: 0 }
  for (const drone of drones) counts[drone.status] += 1
  return counts
}
