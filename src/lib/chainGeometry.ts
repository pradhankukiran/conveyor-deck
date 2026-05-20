import type { Link } from '../modules/types'
import { MODULES } from '../modules/registry'

export type LinkGeometry = {
  id: string
  kind: Link['kind']
  variant: Link['variant']
  /** World coords (mm) of the entry corner of the belt (top-left when heading=0). */
  x: number
  y: number
  /** Direction the belt is travelling at this link, degrees (0 = east, +CCW). */
  heading: number
  length: number
  width: number
}

export type ChainGeometry = {
  links: LinkGeometry[]
  /** Coordinates the chain heads to after the last link (chain end). */
  endX: number
  endY: number
  /** Heading at chain end. */
  endHeading: number
  /** Axis-aligned bounding box of all link rectangles. */
  bounds: { x: number; y: number; width: number; height: number } | null
  /** Total path length walked along the belt (sum of link lengths). */
  pathLengthMm: number
  /** Overall footprint length (max projected x extent). */
  footprintLengthMm: number
  /** Overall height extent (max y span). */
  heightMm: number
}

/**
 * Walks the chain from a fixed start position, accumulating each link's
 * geometry. Angle modules apply their bend (positive = up = decreasing y
 * in screen coords) AFTER their own segment has been drawn.
 *
 * Screen convention: x → right (east), y → down. So "incline up" means
 * the heading rotates by -angle (CCW), pointing the cursor up-right.
 */
export function computeChainGeometry(
  links: Link[],
  conveyorWidth: number,
): ChainGeometry {
  let x = 0
  let y = 0
  let heading = 0

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let pathLen = 0

  const out: LinkGeometry[] = []

  for (const link of links) {
    const def = MODULES[link.kind]
    const len = def.length
    const wid = def.matchesConveyorWidth ? conveyorWidth : 100

    out.push({
      id: link.id,
      kind: link.kind,
      variant: link.variant,
      x,
      y,
      heading,
      length: len,
      width: wid,
    })

    // Track AABB by rotating the four corners around (x, y).
    const rad = (heading * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const corners: Array<[number, number]> = [
      [0, 0],
      [len, 0],
      [len, wid],
      [0, wid],
    ]
    for (const [cx, cy] of corners) {
      const wx = x + cx * cos - cy * sin
      const wy = y + cx * sin + cy * cos
      if (wx < minX) minX = wx
      if (wy < minY) minY = wy
      if (wx > maxX) maxX = wx
      if (wy > maxY) maxY = wy
    }

    // Advance cursor along the heading by the link's length.
    x += len * cos
    y += len * sin
    pathLen += len

    // If this is an angle module, apply its bend AFTER walking through it.
    if (link.kind === 'angle-30' || link.kind === 'angle-45') {
      const bend = def.bendDeg ?? 0
      if (link.variant === 'incline-up') heading -= bend
      else if (link.variant === 'incline-down') heading += bend
    }
  }

  return {
    links: out,
    endX: x,
    endY: y,
    endHeading: heading,
    bounds:
      out.length === 0
        ? null
        : {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          },
    pathLengthMm: pathLen,
    footprintLengthMm: out.length === 0 ? 0 : maxX - minX,
    heightMm: out.length === 0 ? 0 : maxY - minY,
  }
}
