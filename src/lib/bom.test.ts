import { describe, expect, it } from 'vitest'
import { computeBom } from './bom'
import type { Link } from '../modules/types'

describe('computeBom', () => {
  it('prices module, belt, frame, support, and control rows', () => {
    const links: Link[] = [
      { id: 'L1', kind: 'feed', variant: 'horizontal' },
      { id: 'L2', kind: 'straight-short', variant: 'horizontal' },
      { id: 'L3', kind: 'drive', variant: 'horizontal' },
    ]

    const bom = computeBom(links, 600, {
      control: 'VSD + E-stop',
      feedShield: 'yes',
    })

    expect(bom.beltLengthMm).toBe(1420)
    expect(bom.beltAreaM2).toBeCloseTo(0.852)
    expect(bom.rows.map((r) => r.key)).toEqual(
      expect.arrayContaining([
        'mod-feed',
        'mod-straight-short',
        'mod-drive',
        'chain',
        'frame',
        'legs',
        'vsd',
        'estop',
        'feed-shield',
      ]),
    )
    expect(bom.subtotal).toBeGreaterThan(0)
  })

  it('includes manual accessories, price overrides, and support overrides', () => {
    const links: Link[] = [
      { id: 'L1', kind: 'feed', variant: 'horizontal' },
      { id: 'L2', kind: 'drive', variant: 'horizontal' },
    ]

    const bom = computeBom(links, 600, {}, {
      accessoryQuantities: {
        'top-enclosure': 2,
      },
      priceOverrides: {
        'top-enclosure': 123,
      },
      supportOverrides: {
        legPairs: 3,
      },
    })

    expect(bom.legCount).toBe(6)
    expect(bom.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'acc-top-enclosure',
          qty: 2,
          unitPrice: 123,
          lineTotal: 246,
        }),
      ]),
    )
  })
})
