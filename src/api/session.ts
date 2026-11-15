import type { QueryClient } from '@tanstack/react-query'

/** Publish logout to active observers before removing private cached data. */
export async function clearAdminSession(client: QueryClient): Promise<void> {
  await client.cancelQueries()
  client.setQueryData(['session'], null)
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
}
