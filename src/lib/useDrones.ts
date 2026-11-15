import { useMemo } from 'react'
import { useFlights } from '../api/hooks'
import { countByStatus, normalizeDrone } from './drones'

export function useDrones() {
  const flights = useFlights()

  const list = useMemo(
    () => (flights.data ?? []).map(normalizeDrone).sort((a, b) => a.name.localeCompare(b.name)),
    [flights.data],
  )

  return {
    list,
    counts: useMemo(() => countByStatus(list), [list]),
    isPending: flights.isPending,
    isLoading: flights.isLoading,
    error: flights.error,
    refetch: () => {
      void flights.refetch()
    },
    updatedAt: flights.dataUpdatedAt,
  }
}
