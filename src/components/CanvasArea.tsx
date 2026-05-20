import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Layer, Line, Path, Stage, Text } from 'react-konva'
import type Konva from 'konva'
import { useStore } from '../lib/store'
import { ModuleShape } from '../modules/ModuleShape'
import { computeChainGeometry } from '../lib/chainGeometry'
import { setStageHandle } from '../lib/stageHandle'
import { fitBoundsToViewport } from '../lib/bounds'

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

export function CanvasArea() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

  const [size, setSize] = useState({ width: 0, height: 0 })
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)
  const [spaceDown, setSpaceDown] = useState(false)
  const [middleDown, setMiddleDown] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const links = useStore((s) => s.links)
  const conveyorWidth = useStore((s) => s.conveyorWidth)
  const selectedLinkId = useStore((s) => s.selectedLinkId)
  const selectLink = useStore((s) => s.selectLink)
  const removeSelected = useStore((s) => s.removeSelected)
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

  const cursor = panEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default'

  return (
    <main className="relative flex-1 overflow-hidden bg-white">
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

            <Layer>
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
            </Layer>
          </Stage>
        )}
      </div>

      <ChainEmptyState empty={links.length === 0} />

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
