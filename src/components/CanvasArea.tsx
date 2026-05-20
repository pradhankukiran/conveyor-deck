import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Layer, Line, Stage } from 'react-konva'
import type Konva from 'konva'
import { MODULE_DRAG_TYPE, useStore } from '../lib/store'
import type { ModuleKind } from '../modules/types'
import { ModuleShape } from '../modules/ModuleShape'
import { MODULES } from '../modules/registry'
import { computeSnap } from '../lib/snap'
import { setStageHandle } from '../lib/stageHandle'
import { fitBoundsToViewport, getModuleBounds } from '../lib/bounds'

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
  const [dropHover, setDropHover] = useState(false)
  const [snapIndicator, setSnapIndicator] = useState<{
    x: number
    y: number
  } | null>(null)

  const modules = useStore((s) => s.modules)
  const conveyorWidth = useStore((s) => s.conveyorWidth)
  const selectedModuleId = useStore((s) => s.selectedModuleId)
  const addModule = useStore((s) => s.addModule)
  const updateModulePosition = useStore((s) => s.updateModulePosition)
  const selectModule = useStore((s) => s.selectModule)
  const removeSelected = useStore((s) => s.removeSelected)
  const rotateModule = useStore((s) => s.rotateModule)
  const viewResetToken = useStore((s) => s.viewResetToken)
  const setStoreView = useStore((s) => s.setView)

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

  // Publish the stage handle so exports can snapshot it
  useEffect(() => {
    setStageHandle(stageRef.current)
    return () => setStageHandle(null)
  }, [size.width, size.height])

  // Sync local view → store so other code (exports, etc.) sees current camera
  useEffect(() => {
    setStoreView({ x: stagePos.x, y: stagePos.y, scale: stageScale })
  }, [stagePos.x, stagePos.y, stageScale, setStoreView])

  // Fit-to-content when explicitly requested (seed bumps viewResetToken)
  useEffect(() => {
    if (size.width === 0 || size.height === 0) return
    const mods = useStore.getState().modules
    const bounds = getModuleBounds(mods, conveyorWidth)
    if (!bounds) {
      setStageScale(1)
      setStagePos({ x: 0, y: 0 })
      return
    }
    const fit = fitBoundsToViewport(bounds, size, {
      padding: 60,
      maxScale: 0.7,
    })
    setStageScale(fit.scale)
    setStagePos({ x: fit.x, y: fit.y })
  }, [viewResetToken, size.width, size.height, conveyorWidth])

  // Global key handling (space pan, delete, r rotate)
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
      if (isEditable(e.target)) return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setSpaceDown(true)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedModuleId) {
          e.preventDefault()
          removeSelected()
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedModuleId) {
          e.preventDefault()
          rotateModule(selectedModuleId, e.shiftKey ? -15 : 15)
        }
      } else if (e.key === 'Escape') {
        selectModule(null)
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
  }, [selectedModuleId, removeSelected, rotateModule, selectModule])

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
    const mods = useStore.getState().modules
    const cw = useStore.getState().conveyorWidth
    const bounds = getModuleBounds(mods, cw)
    if (!bounds || size.width === 0 || size.height === 0) {
      setStageScale(1)
      setStagePos({ x: 0, y: 0 })
      return
    }
    const fit = fitBoundsToViewport(bounds, size, {
      padding: 60,
      maxScale: 0.7,
    })
    setStageScale(fit.scale)
    setStagePos({ x: fit.x, y: fit.y })
  }, [size])

  // HTML5 drop: receive a module kind from the palette and place it
  const onWrapperDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(MODULE_DRAG_TYPE)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setDropHover(true)
    }
  }, [])

  const onWrapperDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (e.currentTarget === e.target) setDropHover(false)
    },
    [],
  )

  const onWrapperDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDropHover(false)
      const kind = e.dataTransfer.getData(MODULE_DRAG_TYPE) as ModuleKind
      if (!kind || !MODULES[kind]) return
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const worldX = (screenX - stagePos.x) / stageScale
      const worldY = (screenY - stagePos.y) / stageScale
      const def = MODULES[kind]
      const w = def.matchesConveyorWidth
        ? conveyorWidth
        : (def.fixedWidth ?? 100)
      // Center the module on the drop point
      addModule(kind, worldX - def.length / 2, worldY - w / 2)
    },
    [addModule, conveyorWidth, stagePos.x, stagePos.y, stageScale],
  )

  // Click on empty area deselects
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      handleMouseDown(e)
      if (e.target === stageRef.current) selectModule(null)
    },
    [handleMouseDown, selectModule],
  )

  const handleModuleDragMove = useCallback(
    (id: string, x: number, y: number) => {
      const dragged = modules.find((m) => m.id === id)
      if (!dragged) {
        updateModulePosition(id, x, y)
        return null
      }
      const snap = computeSnap(
        modules,
        { id, kind: dragged.kind, x, y, rotation: dragged.rotation },
        conveyorWidth,
      )
      if (snap) {
        setSnapIndicator(snap.target)
        updateModulePosition(id, snap.x, snap.y)
        return { x: snap.x, y: snap.y }
      }
      setSnapIndicator(null)
      updateModulePosition(id, x, y)
      return null
    },
    [modules, conveyorWidth, updateModulePosition],
  )

  const handleModuleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setSnapIndicator(null)
      updateModulePosition(id, x, y)
    },
    [updateModulePosition],
  )

  const cursor = panEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default'

  return (
    <main className="relative flex-1 overflow-hidden bg-stone-50">
      <div
        ref={wrapperRef}
        className="absolute inset-0"
        style={{ cursor }}
        onDragOver={onWrapperDragOver}
        onDragLeave={onWrapperDragLeave}
        onDrop={onWrapperDrop}
      >
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
            onMouseDown={handleStageMouseDown}
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

            <Layer>
              {modules.map((m) => (
                <ModuleShape
                  key={m.id}
                  instance={m}
                  conveyorWidth={conveyorWidth}
                  selected={m.id === selectedModuleId}
                  onSelect={() => selectModule(m.id)}
                  onDragMove={(x, y) => handleModuleDragMove(m.id, x, y)}
                  onDragEnd={(x, y) => handleModuleDragEnd(m.id, x, y)}
                />
              ))}
              {snapIndicator && (
                <>
                  <Circle
                    x={snapIndicator.x}
                    y={snapIndicator.y}
                    radius={18}
                    stroke="#ea580c"
                    strokeWidth={2}
                    dash={[4, 4]}
                    strokeScaleEnabled={false}
                    listening={false}
                  />
                  <Circle
                    x={snapIndicator.x}
                    y={snapIndicator.y}
                    radius={4}
                    fill="#ea580c"
                    listening={false}
                  />
                </>
              )}
            </Layer>
          </Stage>
        )}
      </div>

      {dropHover && (
        <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-orange-400/60" />
      )}

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

      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 text-[11px] text-stone-500">
        <Hint label="Drag" detail="from palette" />
        <Hint label="Space" detail="pan" />
        <Hint label="Wheel" detail="zoom" />
        <Hint label="R" detail="rotate 15°" />
        <Hint label="Del" detail="remove" />
      </div>
    </main>
  )
}

function Hint({ label, detail }: { label: string; detail: string }) {
  return (
    <span className="pointer-events-auto rounded-md bg-white/80 px-2 py-1 ring-1 ring-stone-200 backdrop-blur">
      <kbd className="font-mono text-[10px] font-semibold text-stone-700">
        {label}
      </kbd>
      <span className="ml-1 text-stone-500">{detail}</span>
    </span>
  )
}
