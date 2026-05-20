import type { ModuleInstance } from '../modules/types'
import { MODULES } from '../modules/registry'

export type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

/** Axis-aligned bounding box around all placed modules in world coords (mm). */
export function getModuleBounds(
  modules: ModuleInstance[],
  conveyorWidth: number,
): Bounds | null {
  if (modules.length === 0) return null

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const m of modules) {
    const def = MODULES[m.kind]
    const w = def.matchesConveyorWidth
      ? conveyorWidth
      : (def.fixedWidth ?? 100)
    const l = def.length
    const corners: Array<[number, number]> = [
      [0, 0],
      [l, 0],
      [l, w],
      [0, w],
    ]
    const rad = (m.rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    for (const [cx, cy] of corners) {
      const wx = m.x + cx * cos - cy * sin
      const wy = m.y + cx * sin + cy * cos
      if (wx < minX) minX = wx
      if (wx > maxX) maxX = wx
      if (wy < minY) minY = wy
      if (wy > maxY) maxY = wy
    }
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Choose a stage scale + position so that {@link bounds} is centered with padding. */
export function fitBoundsToViewport(
  bounds: Bounds,
  viewport: { width: number; height: number },
  opts?: { padding?: number; maxScale?: number },
): { x: number; y: number; scale: number } {
  const padding = opts?.padding ?? 80
  const maxScale = opts?.maxScale ?? 1.5
  const scaleX = (viewport.width - padding * 2) / bounds.width
  const scaleY = (viewport.height - padding * 2) / bounds.height
  const scale = Math.min(scaleX, scaleY, maxScale)
  const cx = bounds.x + bounds.width / 2
  const cy = bounds.y + bounds.height / 2
  return {
    x: viewport.width / 2 - cx * scale,
    y: viewport.height / 2 - cy * scale,
    scale,
  }
}
