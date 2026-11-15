import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadPhotoUrl, parsePhotoUrl, PhotoInputError, validatePhoto } from '../src/lib/productPhoto'

const server = createServer((request, response) => {
  switch (request.url) {
    case '/missing':
      response.writeHead(404)
      response.end()
      return
    case '/html':
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end('<html>not an image</html>')
      return
    case '/large':
      response.writeHead(200, { 'content-type': 'image/png', 'content-length': 1024 * 1024 + 1 })
      response.end()
      return
    case '/large-chunked':
      response.writeHead(200, { 'content-type': 'image/png' })
      response.write(new Uint8Array(1024 * 1024))
      response.end(new Uint8Array(1))
      return
    default:
      response.writeHead(200, { 'content-type': 'image/png' })
      response.end(new Uint8Array([137, 80, 78, 71]))
  }
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

describe('product photo input boundary', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s when its size is exactly 1MB', (type) => {
    // Given: a supported photo at the upper size limit.
    const photo = new Blob([new Uint8Array(1024 * 1024)], { type })
    // When / Then: selecting the photo passes the size and MIME boundary.
    expect(() => validatePhoto(photo)).not.toThrow()
  })
  it.each([
    new Blob(['image'], { type: 'image/svg+xml' }),
    new Blob([], { type: 'image/png' }),
    new Blob([new Uint8Array(1024 * 1024 + 1)], { type: 'image/png' }),
  ])('rejects unsupported, empty, or oversized input when selected', (photo) => {
    // Given: an unsupported file. When / Then: reject before preview/upload.
    expect(() => validatePhoto(photo)).toThrow(PhotoInputError)
  })
  it.each(['', 'photo.jpg', 'data:image/png;base64,abc', 'file:///tmp/photo.png', 'https://user:password@example.com/photo.jpg'])('rejects unsafe URL %s when parsed', (value) => {
    // Given: an unsupported scheme or embedded credentials. When / Then: reject before fetch.
    expect(() => parsePhotoUrl(value)).toThrow(PhotoInputError)
  })
  it('accepts a trimmed HTTPS image address when parsed', () => {
    // Given: an ordinary image URL with surrounding whitespace.
    const value = ' https://example.com/photo.png?size=small '
    // When: parsed. Then: preserve the query and normalize whitespace.
    expect(parsePhotoUrl(value).href).toBe('https://example.com/photo.png?size=small')
  })
  it('returns image bytes when a real HTTP endpoint provides a supported photo', async () => {
    // Given: an HTTP image endpoint. When: loaded over the network.
    const photo = await loadPhotoUrl(`${base}/photo`)
    // Then: original bytes remain available for local FileReader preview.
    expect(new Uint8Array(await photo.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]))
  })
  it.each(['/missing', '/html', '/large', '/large-chunked'])('rejects %s when the remote response violates the photo contract', async (path) => {
    // Given: a missing, non-image, or oversized response.
    // When / Then: loading fails before a candidate can be saved.
    await expect(loadPhotoUrl(`${base}${path}`)).rejects.toBeInstanceOf(PhotoInputError)
  })
})
