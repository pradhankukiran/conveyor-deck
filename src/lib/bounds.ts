export type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

/** Compute stage scale + position so {@link bounds} is centered with padding. */
export function fitBoundsToViewport(
  bounds: Bounds,
  viewport: { width: number; height: number },
  opts?: { padding?: number; maxScale?: number },
): { x: number; y: number; scale: number } {
  const padding = opts?.padding ?? 80
  const maxScale = opts?.maxScale ?? 1.5
  const w = Math.max(bounds.width, 1)
  const h = Math.max(bounds.height, 1)
  const scaleX = (viewport.width - padding * 2) / w
  const scaleY = (viewport.height - padding * 2) / h
  const scale = Math.min(scaleX, scaleY, maxScale)
  const cx = bounds.x + w / 2
  const cy = bounds.y + h / 2
  return {
    x: viewport.width / 2 - cx * scale,
    y: viewport.height / 2 - cy * scale,
    scale,
  }
}
