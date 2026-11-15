import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { expect, it } from 'vitest'
import { clearAdminSession } from './session'

it('notifies an active session observer and removes private data when logout succeeds', async () => {
  // Given: a mounted session observer and cached private orders.
  const client = new QueryClient()
  const session = { username: 'admin', expires_at: '2026-11-07T00:00:00Z' }
  client.setQueryData(['session'], session)
  client.setQueryData(['orders'], [{ id: 'private-order' }])
  const observer = new QueryObserver<typeof session | null>(client, {
    queryKey: ['session'], enabled: false,
  })
  const observed: (typeof session | null | undefined)[] = []
  const unsubscribe = observer.subscribe((result) => observed.push(result.data))

  // When: successful logout publishes the anonymous state.
  await clearAdminSession(client)

  // Then: the mounted auth guard receives null and private data is removed.
  expect(observed).toContain(null)
  expect(observer.getCurrentResult().data).toBeNull()
  expect(client.getQueryData(['orders'])).toBeUndefined()
  unsubscribe()
  client.clear()
})
