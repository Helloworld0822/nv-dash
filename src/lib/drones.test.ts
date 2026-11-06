import { describe, expect, it } from 'vitest'
import { droneTelemetryListSchema, normalizeDrone, type DroneTelemetry } from './drones'

const telemetry: DroneTelemetry = {
  drone_id: 'drone-1', online: true, last_seen: '2026-11-06T00:00:00Z',
  battery_pct: 1, status: 'flying', flight_status: 'in_flight', delivery_id: null,
}

describe('latest drone telemetry', () => {
  it('keeps one percent battery when backend reports percent units', () => {
    // Given: a one-percent real telemetry sample. When: adapted for display.
    const drone = normalizeDrone(telemetry)
    // Then: percent is preserved and the stable aircraft ID identifies the row.
    expect(drone.battery).toBe(1)
    expect(drone.id).toBe('drone-1')
    expect(drone.status).toBe('in_transit')
  })
  it('shows disconnected when stale telemetry still says flying', () => {
    // Given: the backend marks a stale aircraft offline. When: displayed.
    const drone = normalizeDrone({ ...telemetry, online: false })
    // Then: old flight status does not imply a live connection.
    expect(drone.status).toBe('offline')
    expect(drone.linkOk).toBe(false)
  })
  it('rejects historical flight rows instead of inventing aircraft fields', () => {
    // Given: a flight-session response. When: parsed as latest telemetry.
    const result = droneTelemetryListSchema.safeParse([{ id: 'flight-1', drone_id: 'drone-1' }])
    // Then: a schema mismatch is visible instead of fabricated UI data.
    expect(result.success).toBe(false)
  })
})
