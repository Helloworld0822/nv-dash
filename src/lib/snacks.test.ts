import { describe, expect, it } from 'vitest'
import { productDraftSchema, SNACK_CATALOG, suggestSku } from './snacks'

const draft = {
  name: '  직접 만든 샌드위치  ', maker: '', category: '', description: '',
  price: '2501', stock: '0', active: true,
}

describe('custom product registration', () => {
  it('accepts an arbitrary name without catalog metadata and preserves zero stock', () => {
    // Given: a product absent from the built-in catalog with optional fields empty.
    // When: parsed for the inventory API.
    const result = productDraftSchema.parse(draft)
    // Then: the requested name and integer values are preserved without invented metadata.
    expect(result).toEqual({
      name: '직접 만든 샌드위치', unit_price: 2501, stock_quantity: 0,
      description: null, active: true,
    })
  })

  it('keeps manufacturer, category, and description together when provided', () => {
    // Given: all optional fields contain separate user-entered information.
    const input = { ...draft, maker: ' 매점 ', category: ' 식사 ', description: ' 당일 제조 ', price: '0' }
    // When: parsed for the inventory API.
    const result = productDraftSchema.parse(input)
    // Then: none of the optional information is discarded and zero price is allowed.
    expect(result.description).toBe('매점 · 식사\n당일 제조')
    expect(result.unit_price).toBe(0)
  })

  it.each(['', '   '])('rejects a blank required name (%j)', (name) => {
    // Given: a name with no visible characters. When: parsed for creation.
    const result = productDraftSchema.safeParse({ ...draft, name })
    // Then: registration cannot proceed.
    expect(result.success).toBe(false)
  })

  it.each(['price', 'stock'] as const)('rejects invalid %s values', (field) => {
    // Given: empty, fractional, negative, nonnumeric, infinite, or unsafe integer input.
    for (const value of ['', ' ', '-1', '0.5', 'abc', 'Infinity', '9007199254740992']) {
      // When: parsed for creation.
      const result = productDraftSchema.safeParse({ ...draft, [field]: value })
      // Then: the invalid amount cannot enter the API payload.
      expect(result.success, `${field}=${value}`).toBe(false)
    }
  })

  it('rejects stock outside the backend integer range', () => {
    // Given: an integer too large for the inventory column. When: parsed for creation.
    const result = productDraftSchema.safeParse({ ...draft, stock: '2147483648' })
    // Then: the unsupported quantity cannot be submitted.
    expect(result.success).toBe(false)
  })

  it('generates distinct SKUs for simultaneous custom and catalog registrations', () => {
    // Given: multiple registrations occurring in the same event loop.
    // When: generating identifiers, including the existing catalog caller.
    const codes = Array.from({ length: 100 }, (_, index) => suggestSku(index % 2 ? SNACK_CATALOG[0] : undefined))
    // Then: no two items share a SKU and every identifier is backend-safe ASCII.
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.every((code) => /^[A-Z0-9]+-[A-F0-9-]{36}$/.test(code))).toBe(true)
  })
})
