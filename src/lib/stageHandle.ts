import type Konva from 'konva'

let stage: Konva.Stage | null = null

export function setStageHandle(s: Konva.Stage | null) {
  stage = s
}

export function getStageHandle(): Konva.Stage | null {
  return stage
}

/**
 * Snapshot the stage as a PNG data URL, cropped to a tight world-coordinate
 * bounding box around all rendered modules. If no modules are placed, falls
 * back to the current visible viewport.
 */
export function snapshotStage(opts?: {
  worldBox?: { x: number; y: number; width: number; height: number }
  pixelRatio?: number
  padding?: number
}): string | null {
  const s = stage
  if (!s) return null

  const pixelRatio = opts?.pixelRatio ?? 2
  const padding = opts?.padding ?? 80

  if (opts?.worldBox) {
    const scale = s.scaleX()
    const sx = opts.worldBox.x * scale + s.x() - padding
    const sy = opts.worldBox.y * scale + s.y() - padding
    const sw = opts.worldBox.width * scale + padding * 2
    const sh = opts.worldBox.height * scale + padding * 2
    return s.toDataURL({
      x: sx,
      y: sy,
      width: sw,
      height: sh,
      pixelRatio,
      mimeType: 'image/png',
    })
  }

  return s.toDataURL({ pixelRatio, mimeType: 'image/png' })
}
