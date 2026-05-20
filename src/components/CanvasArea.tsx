import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent as ReactDragEvent } from 'react'
import { Circle, Group, Layer, Line, Path, Stage, Text } from 'react-konva'
import type Konva from 'konva'
import { MODULE_DRAG_TYPE, canInsertAt, useStore } from '../lib/store'
import { ModuleShape } from '../modules/ModuleShape'
import { AutoLegs } from '../modules/AutoLegs'
import { computeChainGeometry } from '../lib/chainGeometry'
import type { ChainGeometry, Pt } from '../lib/chainGeometry'
import { redo, undo } from '../lib/history'
import { TopViewInset } from './TopViewInset'
import { setStageHandle } from '../lib/stageHandle'
import { fitBoundsToViewport } from '../lib/bounds'
import { MODULE_ORDER } from '../modules/registry'
import type { ModuleKind } from '../modules/types'

const GRID_SPACING = 100 // mm; coarse engineering grid
const GRID_MINOR = 20
const GRID_EXTENT = 6000
const GRID_COLOR_MINOR = '#f5f5f4'
const GRID_COLOR_MAJOR = '#e7e5e4'
const MIN_SCALE = 0.05
const MAX_SCALE = 5
const ZOOM_STEP = 1.05
const DIM = '#525252'
const DIM_ACCENT = '#0a0a0a'

type GridLine = { points: number[]; major: boolean }
type DropTarget = { index: number; point: Pt; heading: number }
type DropPreview = DropTarget & { kind: ModuleKind }

const MODULE_KIND_SET = new Set<ModuleKind>(MODULE_ORDER)

export function CanvasArea() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

  const [size, setSize] = useState({ width: 0, height: 0 })
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)
  const [spaceDown, setSpaceDown] = useState(false)
  const [middleDown, setMiddleDown] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null)
  const [dragRejected, setDragRejected] = useState(false)

  const links = useStore((s) => s.links)
  const conveyorWidth = useStore((s) => s.conveyorWidth)
  const selectedLinkId = useStore((s) => s.selectedLinkId)
  const selectLink = useStore((s) => s.selectLink)
  const removeSelected = useStore((s) => s.removeSelected)
  const insertLink = useStore((s) => s.insertLink)
  const pushToast = useStore((s) => s.pushToast)
  const viewResetToken = useStore((s) => s.viewResetToken)
  const setStoreView = useStore((s) => s.setView)

  const geom = useMemo(
    () => computeChainGeometry(links, conveyorWidth),
    [links, conveyorWidth],
  )

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

  useEffect(() => {
    setStageHandle(stageRef.current)
    return () => setStageHandle(null)
  }, [size.width, size.height])

  useEffect(() => {
    setStoreView({ x: stagePos.x, y: stagePos.y, scale: stageScale })
  }, [stagePos.x, stagePos.y, stageScale, setStoreView])

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return
    const id = requestAnimationFrame(() => {
      const bounds = geom.bounds
      if (!bounds) {
        setStageScale(1)
        setStagePos({ x: size.width / 2, y: size.height / 2 })
        return
      }
      // Pad to leave room for dimension lines outside the modules
      const padded = {
        x: bounds.x - 250,
        y: bounds.y - 250,
        width: bounds.width + 500,
        height: bounds.height + 500,
      }
      const fit = fitBoundsToViewport(padded, size, { padding: 40, maxScale: 0.6 })
      setStageScale(fit.scale)
      setStagePos({ x: fit.x, y: fit.y })
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewResetToken, size.width, size.height])

  // Keyboard
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
      const meta = e.ctrlKey || e.metaKey
      if (meta && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
        return
      }
      if (meta && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        redo()
        return
      }
      if (isEditable(e.target)) return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setSpaceDown(true)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLinkId) {
          e.preventDefault()
          removeSelected()
        }
      } else if (e.key === 'Escape') {
        selectLink(null)
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
  }, [selectedLinkId, removeSelected, selectLink])

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
    for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += GRID_MINOR) {
      const major = x % GRID_SPACING === 0
      lines.push({ points: [x, -GRID_EXTENT, x, GRID_EXTENT], major })
    }
    for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += GRID_MINOR) {
      const major = y % GRID_SPACING === 0
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
      if (e.target === stageRef.current) {
        selectLink(null)
      }
    },
    [selectLink],
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
    useStore.getState().requestViewReset()
  }, [])

  const getDropTarget = useCallback(
    (clientX: number, clientY: number, kind: ModuleKind): DropTarget | null => {
      const el = wrapperRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const pointer = {
        x: (clientX - rect.left - stagePos.x) / stageScale,
        y: (clientY - rect.top - stagePos.y) / stageScale,
      }
      let nearest: DropTarget | null = null
      let nearestDistance = Number.POSITIVE_INFINITY
      for (let index = 0; index <= links.length; index++) {
        if (!canInsertAt(links, kind, index).ok) continue
        const slot = getInsertionSlot(geom, index)
        const distance = squaredDistance(pointer, slot.point)
        if (distance < nearestDistance) {
          nearest = { index, ...slot }
          nearestDistance = distance
        }
      }
      return nearest
    },
    [geom, links, stagePos.x, stagePos.y, stageScale],
  )

  const handleNativeDragOver = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      const kind = getDraggedModuleKind(e.dataTransfer)
      if (!kind) return
      e.preventDefault()
      const target = getDropTarget(e.clientX, e.clientY, kind)
      e.dataTransfer.dropEffect = target ? 'copy' : 'none'
      setDropPreview(target ? { ...target, kind } : null)
      setDragRejected(!target)
    },
    [getDropTarget],
  )

  const handleNativeDrop = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      const kind = getDraggedModuleKind(e.dataTransfer)
      if (!kind) return
      e.preventDefault()
      const target = getDropTarget(e.clientX, e.clientY, kind)
      setDropPreview(null)
      setDragRejected(false)
      if (!target) {
        pushToast('No valid position for that module')
        return
      }
      insertLink(kind, target.index)
    },
    [getDropTarget, insertLink, pushToast],
  )

  const handleNativeDragLeave = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      const next = e.relatedTarget
      if (next instanceof Node && e.currentTarget.contains(next)) return
      setDropPreview(null)
      setDragRejected(false)
    },
    [],
  )

  const cursor = panEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default'

  return (
    <main className="relative flex-1 overflow-hidden bg-white">
      <div
        ref={wrapperRef}
        className="absolute inset-0"
        style={{ cursor }}
        onDragOver={handleNativeDragOver}
        onDrop={handleNativeDrop}
        onDragLeave={handleNativeDragLeave}
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

            <Layer>
              <AutoLegs geo={geom} />
              {geom.links.map((g) => (
                <ModuleShape
                  key={g.id}
                  geom={g}
                  selected={g.id === selectedLinkId}
                  onSelect={() => selectLink(g.id)}
                />
              ))}
              {geom.bounds && (
                <OverallDimensions
                  bounds={geom.bounds}
                  beltLengthMm={geom.pathLengthMm}
                />
              )}
              {dropPreview && (
                <DropMarker
                  point={dropPreview.point}
                  heading={dropPreview.heading}
                  width={conveyorWidth}
                  scale={stageScale}
                />
              )}
            </Layer>
          </Stage>
        )}
      </div>

      <ChainEmptyState empty={links.length === 0} />
      <TopViewInset />

      {(dropPreview || dragRejected) && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200 backdrop-blur">
          {dropPreview
            ? 'Release to place module'
            : 'No valid spot for this module'}
        </div>
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
          Fit view
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 text-[11px] text-stone-500">
        <Hint label="Click" detail="select link" />
        <Hint label="Space" detail="pan" />
        <Hint label="Wheel" detail="zoom" />
        <Hint label="Del" detail="remove" />
      </div>
    </main>
  )
}

function getDraggedModuleKind(dataTransfer: DataTransfer): ModuleKind | null {
  const fromPayload = dataTransfer.getData(MODULE_DRAG_TYPE)
  if (isModuleKind(fromPayload)) return fromPayload

  const typedPrefix = `${MODULE_DRAG_TYPE}:`
  const fromType = Array.from(dataTransfer.types).find((type) =>
    type.startsWith(typedPrefix),
  )
  const kind = fromType?.slice(typedPrefix.length)
  return isModuleKind(kind) ? kind : null
}

function isModuleKind(value: string | undefined): value is ModuleKind {
  return !!value && MODULE_KIND_SET.has(value as ModuleKind)
}

function getInsertionSlot(geom: ChainGeometry, index: number): {
  point: Pt
  heading: number
} {
  if (geom.links.length === 0) {
    return { point: geom.endCenter, heading: geom.endHeading }
  }
  if (index <= 0) {
    const first = geom.links[0]!
    return { point: first.centerEntry, heading: first.entryHeading }
  }
  if (index >= geom.links.length) {
    return { point: geom.endCenter, heading: geom.endHeading }
  }
  const before = geom.links[index - 1]!
  return { point: before.centerExit, heading: before.exitHeading }
}

function squaredDistance(a: Pt, b: Pt): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

function DropMarker({
  point,
  heading,
  width,
  scale,
}: {
  point: Pt
  heading: number
  width: number
  scale: number
}) {
  const radians = (heading * Math.PI) / 180
  const half = Math.max(width / 2 + 70, 160)
  const nx = Math.sin(radians)
  const ny = -Math.cos(radians)
  const radius = 9 / scale
  return (
    <Group listening={false}>
      <Line
        points={[
          point.x - nx * half,
          point.y - ny * half,
          point.x + nx * half,
          point.y + ny * half,
        ]}
        stroke="#16a34a"
        strokeWidth={3}
        strokeScaleEnabled={false}
        dash={[10, 6]}
      />
      <Circle
        x={point.x}
        y={point.y}
        radius={radius}
        fill="#16a34a"
        stroke="#ffffff"
        strokeWidth={2}
        strokeScaleEnabled={false}
      />
    </Group>
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

function ChainEmptyState({ empty }: { empty: boolean }) {
  if (!empty) return null
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="pointer-events-auto rounded-md bg-white/90 px-4 py-3 text-center ring-1 ring-stone-200 backdrop-blur">
        <p className="text-sm font-medium text-stone-800">No conveyor yet</p>
        <p className="mt-1 text-xs text-stone-500">
          Add a Feed section from the component library to begin.
        </p>
      </div>
    </div>
  )
}

function OverallDimensions({
  bounds,
  beltLengthMm,
}: {
  bounds: { x: number; y: number; width: number; height: number }
  beltLengthMm: number
}) {
  const OFFSET = 140
  const TICK = 30
  const ARROW = 24
  const TEXT_OFFSET = 70

  const x0 = bounds.x
  const x1 = bounds.x + bounds.width
  const y0 = bounds.y
  const y1 = bounds.y + bounds.height
  const yDim = y1 + OFFSET
  const xDim = x1 + OFFSET

  return (
    <Group listening={false}>
      {/* Horizontal overall length dimension below */}
      <Line
        points={[x0, y1 + 20, x0, yDim + TICK / 2]}
        stroke={DIM}
        strokeWidth={DIM_WEIGHT_DIM}
        strokeScaleEnabled={false}
      />
      <Line
        points={[x1, y1 + 20, x1, yDim + TICK / 2]}
        stroke={DIM}
        strokeWidth={DIM_WEIGHT_DIM}
        strokeScaleEnabled={false}
      />
      <Line
        points={[x0, yDim, x1, yDim]}
        stroke={DIM}
        strokeWidth={DIM_WEIGHT_DIM}
        strokeScaleEnabled={false}
      />
      <Path
        data={`M ${x0 + ARROW} ${yDim - ARROW / 2.5} L ${x0} ${yDim} L ${x0 + ARROW} ${yDim + ARROW / 2.5}`}
        stroke={DIM_ACCENT}
        fill={DIM_ACCENT}
        strokeWidth={1}
        strokeScaleEnabled={false}
      />
      <Path
        data={`M ${x1 - ARROW} ${yDim - ARROW / 2.5} L ${x1} ${yDim} L ${x1 - ARROW} ${yDim + ARROW / 2.5}`}
        stroke={DIM_ACCENT}
        fill={DIM_ACCENT}
        strokeWidth={1}
        strokeScaleEnabled={false}
      />
      <Text
        x={(x0 + x1) / 2 - 80}
        y={yDim - TEXT_OFFSET}
        text={`${Math.round(bounds.width)} mm`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={42}
        fontStyle="700"
        fill={DIM_ACCENT}
      />
      <Text
        x={(x0 + x1) / 2 - 70}
        y={yDim - TEXT_OFFSET + 50}
        text={`(belt: ${Math.round(beltLengthMm)} mm)`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={26}
        fill={DIM}
      />

      {/* Vertical overall height dimension on the right */}
      {bounds.height > 60 && (
        <>
          <Line
            points={[x1 + 20, y0, xDim + TICK / 2, y0]}
            stroke={DIM}
            strokeWidth={DIM_WEIGHT_DIM}
            strokeScaleEnabled={false}
          />
          <Line
            points={[x1 + 20, y1, xDim + TICK / 2, y1]}
            stroke={DIM}
            strokeWidth={DIM_WEIGHT_DIM}
            strokeScaleEnabled={false}
          />
          <Line
            points={[xDim, y0, xDim, y1]}
            stroke={DIM}
            strokeWidth={DIM_WEIGHT_DIM}
            strokeScaleEnabled={false}
          />
          <Path
            data={`M ${xDim - ARROW / 2.5} ${y0 + ARROW} L ${xDim} ${y0} L ${xDim + ARROW / 2.5} ${y0 + ARROW}`}
            stroke={DIM_ACCENT}
            fill={DIM_ACCENT}
            strokeWidth={1}
            strokeScaleEnabled={false}
          />
          <Path
            data={`M ${xDim - ARROW / 2.5} ${y1 - ARROW} L ${xDim} ${y1} L ${xDim + ARROW / 2.5} ${y1 - ARROW}`}
            stroke={DIM_ACCENT}
            fill={DIM_ACCENT}
            strokeWidth={1}
            strokeScaleEnabled={false}
          />
          <Text
            x={xDim + 20}
            y={(y0 + y1) / 2 - 22}
            text={`${Math.round(bounds.height)} mm`}
            fontFamily="ui-monospace, Menlo, Consolas, monospace"
            fontSize={42}
            fontStyle="700"
            fill={DIM_ACCENT}
          />
        </>
      )}
    </Group>
  )
}

const DIM_WEIGHT_DIM = 1.2
