import { describe, expect, it } from 'vitest'
import { canInsertAt, validateChain } from './store'
import type { Link } from '../modules/types'

describe('chain validation', () => {
  it('allows angle insertion between belt sections but not at boundaries', () => {
    const links: Link[] = [
      { id: 'L1', kind: 'feed', variant: 'horizontal' },
      { id: 'L2', kind: 'straight-short', variant: 'horizontal' },
      { id: 'L3', kind: 'drive', variant: 'horizontal' },
    ]

    expect(canInsertAt(links, 'angle-30', 0).ok).toBe(false)
    expect(canInsertAt(links, 'angle-30', 2).ok).toBe(true)
    expect(canInsertAt(links, 'angle-30', 3).ok).toBe(false)
  })

  it('rejects duplicate feed and drive modules', () => {
    expect(
      validateChain([
        { id: 'L1', kind: 'feed', variant: 'horizontal' },
        { id: 'L2', kind: 'feed-low-profile', variant: 'horizontal' },
      ]).ok,
    ).toBe(false)

    expect(
      validateChain([
        { id: 'L1', kind: 'drive', variant: 'horizontal' },
        { id: 'L2', kind: 'drive-compact', variant: 'horizontal' },
      ]).ok,
    ).toBe(false)
  })

  it('keeps accessory catalog items out of snapped chain insertion', () => {
    expect(canInsertAt([], 'castor', 0)).toEqual({
      ok: false,
      reason: 'Configured from the properties panel',
    })
  })
})
