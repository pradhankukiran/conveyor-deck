import type { Link } from '../modules/types'
import { MODULES } from '../modules/registry'

export type Pt = { x: number; y: number }

export type LinkGeometry = {
  id: string
  kind: Link['kind']
  variant: Link['variant']
  /** 4 corners in world coords, order: entry-above, exit-above, exit-below, entry-below. */
  corners: [Pt, Pt, Pt, Pt]
  /** Belt centerline endpoints in world coords. For angle modules this is the chord. */
  centerEntry: Pt
  centerExit: Pt
  /** Belt heading at entry / exit, degrees (0 = east, screen y-down). */
  entryHeading: number
  exitHeading: number
  /** Direction of the chord (same as entryHeading for straights). */
  chordHeading: number
  length: number
  width: number
}

export type ChainGeometry = {
  links: LinkGeometry[]
  /** Cursor centerline position at the chain end. */
  endCenter: Pt
  endHeading: number
  /** Axis-aligned bounding box covering all link corners. */
  bounds: { x: number; y: number; width: number; height: number } | null
  /** Sum of link nominal lengths along their chords (mm). */
  pathLengthMm: number
  /** Footprint width along the chain (max x − min x). */
  footprintLengthMm: number
  /** Footprint height (max y − min y). */
  heightMm: number
}

/**
 * "Above" the belt direction H is the perpendicular at heading H - 90°.
 * In screen coords (y down), with H=0 (east), above = (0, -1) i.e. up the page.
 */
function perpAbove(headingDeg: number, distance: number): Pt {
  const r = (headingDeg * Math.PI) / 180
  return { x: distance * Math.sin(r), y: -distance * Math.cos(r) }
}

function add(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y }
}
function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y }
}

/**
 * Walks the chain from origin. Each link's corner polygon meets its
 * neighbour's edge-to-edge because both edges sit at the same world heading
 * (the exit heading of N == entry heading of N+1).
 *
 * For an angle module: the module body becomes a trapezoid. Its entry edge
 * is perpendicular to the entry heading; its exit edge is perpendicular to
 * the exit heading. The belt centerline lies along the chord.
 */
export function computeChainGeometry(
  links: Link[],
  conveyorWidth: number,
): ChainGeometry {
  let center: Pt = { x: 0, y: 0 }
  let heading = 0

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let pathLen = 0

  const out: LinkGeometry[] = []

  for (const link of links) {
    const def = MODULES[link.kind]
    const L = def.length
    const W = def.matchesConveyorWidth ? conveyorWidth : 100

    let chordHeading = heading
    let exitHeading = heading

    if (def.role === 'angle') {
      const sign = link.variant === 'incline-up' ? -1 : 1
      const bend = def.bendDeg ?? 0
      chordHeading = heading + (sign * bend) / 2
      exitHeading = heading + sign * bend
    }

    const cr = (chordHeading * Math.PI) / 180
    const exitCenter: Pt = {
      x: center.x + L * Math.cos(cr),
      y: center.y + L * Math.sin(cr),
    }

    // Entry edge: perpendicular to entry heading
    const halfWAbove = perpAbove(heading, W / 2)
    const entryAbove = add(center, halfWAbove)
    const entryBelow = sub(center, halfWAbove)

    // Exit edge: perpendicular to exit heading
    const halfWAboveExit = perpAbove(exitHeading, W / 2)
    const exitAbove = add(exitCenter, halfWAboveExit)
    const exitBelow = sub(exitCenter, halfWAboveExit)

    const corners: [Pt, Pt, Pt, Pt] = [
      entryAbove,
      exitAbove,
      exitBelow,
      entryBelow,
    ]

    for (const p of corners) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }

    out.push({
      id: link.id,
      kind: link.kind,
      variant: link.variant,
      corners,
      centerEntry: center,
      centerExit: exitCenter,
      entryHeading: heading,
      exitHeading,
      chordHeading,
      length: L,
      width: W,
    })

    pathLen += L
    center = exitCenter
    heading = exitHeading
  }

  return {
    links: out,
    endCenter: center,
    endHeading: heading,
    bounds:
      out.length === 0
        ? null
        : { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    pathLengthMm: pathLen,
    footprintLengthMm: out.length === 0 ? 0 : maxX - minX,
    heightMm: out.length === 0 ? 0 : maxY - minY,
  }
}

/**
 * Pick equally-spaced points along the belt centerline (chords) at intervals
 * of ~targetSpacingMm. Excludes the very entry/exit unless they snap exactly.
 * Used for leg placement.
 */
export function sampleCenterline(
  geo: ChainGeometry,
  targetSpacingMm: number,
): Array<{ pos: Pt; heading: number }> {
  if (geo.links.length === 0 || geo.pathLengthMm === 0) return []
  const total = geo.pathLengthMm
  const count = Math.max(2, Math.round(total / targetSpacingMm))
  const out: Array<{ pos: Pt; heading: number }> = []
  for (let i = 0; i < count + 1; i++) {
    const targetDist = (total / count) * i
    let acc = 0
    for (const link of geo.links) {
      const next = acc + link.length
      if (targetDist <= next || link === geo.links[geo.links.length - 1]) {
        const u = (targetDist - acc) / link.length
        const cr = (link.chordHeading * Math.PI) / 180
        out.push({
          pos: {
            x: link.centerEntry.x + u * link.length * Math.cos(cr),
            y: link.centerEntry.y + u * link.length * Math.sin(cr),
          },
          heading: link.chordHeading,
        })
        break
      }
      acc = next
    }
  }
  return out
}
