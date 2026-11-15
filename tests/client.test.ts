import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { api, ApiError } from '../src/api/client'

const server = createServer((request, response) => {
  if (request.url === '/denied') {
    response.writeHead(401, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'session expired' }))
    return
  }
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ url: request.url }))
})
let base = ''
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address && typeof address !== 'string') base = `http://127.0.0.1:${address.port}`
})
afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

describe('API boundary', () => {
  it('preserves authentication status and backend error message when denied', async () => {
    // Given: a real HTTP endpoint denies an expired session. When: requested.
    const result = api(`${base}/denied`)
    // Then: callers can distinguish authentication failure from server failure.
    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({ status: 401, message: 'session expired' })
  })
  it('encodes filter values when sending list queries', async () => {
    // Given: a filter includes reserved URL characters. When: sent over HTTP.
    const result = await api<{ url: string }>(`${base}/items`, { query: { status: 'a&b', offset: 0, absent: undefined } })
    // Then: the backend sees one encoded filter and the zero offset.
    expect(result.url).toBe('/items?status=a%26b&offset=0')
  })
})
