import { describe, expect, it } from 'vitest'
import { computeChainGeometry } from './chainGeometry'
import type { Link } from '../modules/types'

describe('computeChainGeometry', () => {
  it('walks straight modules using their registry lengths', () => {
    const links: Link[] = [
      { id: 'L1', kind: 'feed', variant: 'horizontal' },
      { id: 'L2', kind: 'straight-short', variant: 'horizontal' },
      { id: 'L3', kind: 'drive', variant: 'horizontal' },
    ]

    const geo = computeChainGeometry(links, 600)

    expect(geo.links).toHaveLength(3)
    expect(geo.pathLengthMm).toBe(1420)
    expect(geo.endCenter.x).toBeCloseTo(1420)
    expect(geo.endCenter.y).toBeCloseTo(0)
    expect(geo.footprintLengthMm).toBeCloseTo(1420)
    expect(geo.heightMm).toBeCloseTo(600)
  })

  it('changes heading across incline angle modules', () => {
    const links: Link[] = [
      { id: 'L1', kind: 'feed', variant: 'horizontal' },
      { id: 'L2', kind: 'angle-30', variant: 'incline-up' },
      { id: 'L3', kind: 'straight-short', variant: 'horizontal' },
      { id: 'L4', kind: 'angle-30', variant: 'incline-down' },
      { id: 'L5', kind: 'drive', variant: 'horizontal' },
    ]

    const geo = computeChainGeometry(links, 600)

    expect(geo.links[1]?.exitHeading).toBe(-30)
    expect(geo.links[2]?.entryHeading).toBe(-30)
    expect(geo.links[3]?.exitHeading).toBe(0)
    expect(geo.endHeading).toBe(0)
    expect(geo.heightMm).toBeGreaterThan(600)
  })
})
