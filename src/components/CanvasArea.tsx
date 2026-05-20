import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Line, Stage } from 'react-konva'
import type Konva from 'konva'

const GRID_SPACING = 20
const GRID_EXTENT = 2500
const GRID_COLOR_MINOR = '#e7e5e4'
const GRID_COLOR_MAJOR = '#d6d3d1'
const MIN_SCALE = 0.1
const MAX_SCALE = 5
const ZOOM_STEP = 1.05

type GridLine = { points: number[]; major: boolean }

export function CanvasArea() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

  const [size, setSize] = useState({ width: 0, height: 0 })
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)
  const [spaceDown, setSpaceDown] = useState(false)
  const [middleDown, setMiddleDown] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Track parent size with ResizeObserver
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: rect.width, height: rect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Spacebar pan mode (ignore when typing in inputs)
  useEffect(() => {
    const isEditable = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      )
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isEditable(e.target)) {
        e.preventDefault()
        setSpaceDown(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // If the mouse leaves the window while MMB is held, release the pan latch.
  useEffect(() => {
    if (!middleDown) return
    const onUp = (e: MouseEvent) => {
      if (e.button === 1) setMiddleDown(false)
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [middleDown])

  const panEnabled = spaceDown || middleDown

  // Build grid lines once. Lines live in world coords; Konva applies the stage
  // transform, so the geometry is scale-independent.
  const gridLines = useMemo<GridLine[]>(() => {
    const lines: GridLine[] = []
    for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += GRID_SPACING) {
      const major = Math.round(x / GRID_SPACING) % 5 === 0
      lines.push({ points: [x, -GRID_EXTENT, x, GRID_EXTENT], major })
    }
    for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += GRID_SPACING) {
      const major = Math.round(y / GRID_SPACING) % 5 === 0
      lines.push({ points: [-GRID_EXTENT, y, GRID_EXTENT, y], major })
    }
    return lines
  }, [])

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      const pointer = stage?.getPointerPosition()
      if (!pointer) return
      const oldScale = stageScale
      const worldX = (pointer.x - stagePos.x) / oldScale
      const worldY = (pointer.y - stagePos.y) / oldScale
      const direction = e.evt.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, oldScale * direction),
      )
      setStageScale(newScale)
      setStagePos({
        x: pointer.x - worldX * newScale,
        y: pointer.y - worldY * newScale,
      })
    },
    [stageScale, stagePos.x, stagePos.y],
  )

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        e.evt.preventDefault()
        setMiddleDown(true)
      }
    },
    [],
  )

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) setMiddleDown(false)
  }, [])

  const syncStagePos = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Only the Stage itself should drive the camera position
    if (e.target === stageRef.current) {
      const pos = e.target.position()
      setStagePos({ x: pos.x, y: pos.y })
    }
  }, [])

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false)
      syncStagePos(e)
    },
    [syncStagePos],
  )

  const resetView = useCallback(() => {
    setStageScale(1)
    setStagePos({ x: 0, y: 0 })
  }, [])

  const cursor = panEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default'

  return (
    <main className="relative flex-1 overflow-hidden bg-stone-50">
      <div ref={wrapperRef} className="absolute inset-0" style={{ cursor }}>
        {size.width > 0 && size.height > 0 && (
          <Stage
            ref={stageRef}
            width={size.width}
            height={size.height}
            x={stagePos.x}
            y={stagePos.y}
            scaleX={stageScale}
            scaleY={stageScale}
            draggable={panEnabled}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDragStart={() => setIsDragging(true)}
            onDragMove={syncStagePos}
            onDragEnd={handleDragEnd}
          >
            <Layer listening={false}>
              {gridLines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.major ? GRID_COLOR_MAJOR : GRID_COLOR_MINOR}
                  strokeWidth={1}
                  hitStrokeWidth={0}
                  perfectDrawEnabled={false}
                  listening={false}
                  strokeScaleEnabled={false}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
        <span className="pointer-events-auto rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200 backdrop-blur">
          {Math.round(stageScale * 100)}%
        </span>
        <button
          type="button"
          onClick={resetView}
          className="pointer-events-auto rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200 backdrop-blur transition hover:bg-white hover:text-stone-900"
        >
          Reset view
        </button>
      </div>
    </main>
  )
}
