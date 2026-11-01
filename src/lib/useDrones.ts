import { useMemo } from 'react'
import { useDeliveries, useFlights } from '../api/hooks'
import { countByStatus, mergeDrones } from './drones'

export function useDrones() {
  const flights = useFlights()
  const deliveries = useDeliveries()

  const list = useMemo(
    () => mergeDrones([flights.data ?? [], deliveries.data ?? []]),
    [flights.data, deliveries.data],
  )

  return {
    list,
    counts: useMemo(() => countByStatus(list), [list]),
    isPending: flights.isPending || deliveries.isPending,
    isLoading: flights.isLoading || deliveries.isLoading,
    error: flights.error ?? deliveries.error,
    refetch: () => {
      void flights.refetch()
      void deliveries.refetch()
    },
    updatedAt: Math.max(flights.dataUpdatedAt, deliveries.dataUpdatedAt),
  }
}
