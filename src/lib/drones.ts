import type { UnknownRecord } from '../api/types'

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

export const DRONE_STATUS_LABEL: Record<DroneStatus, string> = {
  in_transit: '배송 중',
  idle: '대기',
  charging: '충전 중',
  maintenance: '점검 필요',
  offline: '연결 끊김',
}

function pick(raw: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = raw[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function toStatus(raw: string | null): DroneStatus {
  const value = (raw ?? '').toLowerCase()
  if (/transit|flying|en_?route|delivering|airborne|active/.test(value)) return 'in_transit'
  if (/charg/.test(value)) return 'charging'
  if (/maint|inspect|repair|fault|error/.test(value)) return 'maintenance'
  if (/offline|lost|disconnect/.test(value)) return 'offline'
  return 'idle'
}

/**
 * /api/v1/flights · /api/v1/deliveries 는 OpenAPI 문서에 없고 운영 서버가 빈 배열만 돌려준다.
 * 응답 필드 이름을 확정할 수 없어, 흔히 쓰는 키들을 훑어서 화면용 모델로 추린다.
 */
export function normalizeDrone(raw: UnknownRecord): Drone {
  const id =
    asString(pick(raw, ['drone_id', 'droneId', 'aircraft_id', 'id', 'serial'])) ??
    Math.random().toString(36).slice(2)
  const name = asString(pick(raw, ['drone_id', 'name', 'call_sign', 'callSign', 'serial'])) ?? id
  const status = toStatus(asString(pick(raw, ['status', 'state', 'phase'])))
  const batteryRaw = asNumber(
    pick(raw, ['battery', 'battery_pct', 'battery_percent', 'battery_level', 'soc']),
  )
  const battery = batteryRaw === null ? null : batteryRaw <= 1 ? Math.round(batteryRaw * 100) : Math.round(batteryRaw)
  const lastSeen = asString(pick(raw, ['updated_at', 'last_seen', 'last_seen_at', 'created_at']))

  return {
    id,
    name,
    status,
    battery,
    place: asString(pick(raw, ['destination', 'target', 'location', 'route_name', 'address'])),
    orderNumber: asString(pick(raw, ['order_number', 'order_id', 'delivery_id'])),
    lastSeen,
    linkOk: status !== 'offline',
  }
}

/** flights 와 deliveries 를 기체 단위로 합친다. 같은 기체가 양쪽에 있으면 한 줄로 묶는다. */
export function mergeDrones(sources: UnknownRecord[][]): Drone[] {
  const byName = new Map<string, Drone>()
  for (const list of sources) {
    for (const raw of list ?? []) {
      const drone = normalizeDrone(raw)
      const existing = byName.get(drone.name)
      if (!existing) {
        byName.set(drone.name, drone)
        continue
      }
      byName.set(drone.name, {
        ...existing,
        status: existing.status === 'idle' ? drone.status : existing.status,
        battery: existing.battery ?? drone.battery,
        place: existing.place ?? drone.place,
        orderNumber: existing.orderNumber ?? drone.orderNumber,
        lastSeen: existing.lastSeen ?? drone.lastSeen,
      })
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function countByStatus(drones: Drone[]) {
  const counts: Record<DroneStatus, number> = {
    in_transit: 0,
    idle: 0,
    charging: 0,
    maintenance: 0,
    offline: 0,
  }
  for (const drone of drones) counts[drone.status] += 1
  return counts
}
