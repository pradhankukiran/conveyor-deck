import { Group, Rect, Line, Circle, Text, Arc, Path } from 'react-konva'
import type Konva from 'konva'
import type { ModuleInstance } from './types'
import { MODULES } from './registry'

const INK = '#0a0a0a'
const INK_DIM = '#525252'
const PAPER = '#ffffff'
const HATCH = '#737373'
const MOTOR_FILL = '#1f1f1f'
const SELECTED = '#ea580c'

const OUTLINE_WEIGHT = 1.4
const DETAIL_WEIGHT = 0.6
const DIM_WEIGHT = 0.5

type Props = {
  instance: ModuleInstance
  conveyorWidth: number
  selected: boolean
  onSelect: () => void
  onDragMove: (x: number, y: number) => { x: number; y: number } | null
  onDragEnd: (x: number, y: number) => void
}

export function ModuleShape({
  instance,
  conveyorWidth,
  selected,
  onSelect,
  onDragMove,
  onDragEnd,
}: Props) {
  const def = MODULES[instance.kind]
  const length = def.length
  const width = def.matchesConveyorWidth
    ? conveyorWidth
    : (def.fixedWidth ?? 100)

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const adjusted = onDragMove(e.target.x(), e.target.y())
    if (adjusted) {
      e.target.x(adjusted.x)
      e.target.y(adjusted.y)
    }
  }
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(e.target.x(), e.target.y())
  }

  return (
    <Group
      x={instance.x}
      y={instance.y}
      rotation={instance.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onMouseDown={onSelect}
      onDragStart={onSelect}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {def.visual === 'feed' && <FeedShape length={length} width={width} />}
      {def.visual === 'plain' && <StraightShape length={length} width={width} />}
      {def.visual === 'angle-30' && (
        <AngleShape length={length} width={width} angle={30} />
      )}
      {def.visual === 'angle-45' && (
        <AngleShape length={length} width={width} angle={45} />
      )}
      {def.visual === 'drive' && <DriveShape length={length} width={width} />}
      {def.visual === 'leg' && <LegShape length={length} width={width} />}
      {def.visual === 'castor' && (
        <CastorShape length={length} width={width} brake={false} />
      )}
      {def.visual === 'castor-brake' && (
        <CastorShape length={length} width={width} brake={true} />
      )}

      {selected && (
        <>
          <Rect
            x={-4}
            y={-4}
            width={length + 8}
            height={width + 8}
            stroke={SELECTED}
            strokeWidth={1.2}
            dash={[6, 4]}
            listening={false}
            strokeScaleEnabled={false}
          />
          {def.group === 'belt' && (
            <Dimensions length={length} width={width} />
          )}
        </>
      )}
    </Group>
  )
}

/** Module body: sharp-cornered rect with thin black outline + dashed center. */
function ModuleBody({
  length,
  width,
  fill = PAPER,
}: {
  length: number
  width: number
  fill?: string
}) {
  return (
    <>
      <Rect
        x={0}
        y={0}
        width={length}
        height={width}
        fill={fill}
        stroke={INK}
        strokeWidth={OUTLINE_WEIGHT}
        strokeScaleEnabled={false}
      />
      {/* Belt-side inner edge lines (chain rails) */}
      <Line
        points={[0, 14, length, 14]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[0, width - 14, length, width - 14]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Belt center line — dashed engineering centerline */}
      <Line
        points={[0, width / 2, length, width / 2]}
        stroke={INK_DIM}
        strokeWidth={DIM_WEIGHT}
        dash={[14, 3, 2, 3]}
        strokeScaleEnabled={false}
        listening={false}
      />
    </>
  )
}

/** Chain-link cross strokes evenly along the belt length. */
function ChainPattern({
  length,
  width,
  pitch = 60,
  inset = 14,
}: {
  length: number
  width: number
  pitch?: number
  inset?: number
}) {
  const lines: number[] = []
  for (let x = pitch; x < length; x += pitch) {
    lines.push(x)
  }
  return (
    <>
      {lines.map((x) => (
        <Line
          key={x}
          points={[x, inset, x, width - inset]}
          stroke={INK_DIM}
          strokeWidth={DETAIL_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
    </>
  )
}

function StraightShape({ length, width }: { length: number; width: number }) {
  return (
    <>
      <ModuleBody length={length} width={width} />
      <ChainPattern length={length} width={width} />
    </>
  )
}

function FeedShape({ length, width }: { length: number; width: number }) {
  // Hopper opening shown as inner rectangle with diagonal hatching
  const hopInset = 20
  const hopX = 40
  const hopW = length - hopX - 30
  const hopY = hopInset
  const hopH = width - hopInset * 2
  const hatchSpacing = 10
  const hatchLines: number[][] = []
  for (let off = -hopH; off < hopW; off += hatchSpacing) {
    const x1 = Math.max(0, off)
    const y1 = Math.max(0, -off)
    const x2 = Math.min(hopW, off + hopH)
    const y2 = Math.min(hopH, hopW - off + (hopH - hopW))
    if (x2 > x1) hatchLines.push([hopX + x1, hopY + y1, hopX + x2, hopY + y2])
  }
  return (
    <>
      <ModuleBody length={length} width={width} />
      {/* Hopper outline */}
      <Rect
        x={hopX}
        y={hopY}
        width={hopW}
        height={hopH}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Hatching inside the hopper window */}
      {hatchLines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          stroke={HATCH}
          strokeWidth={DIM_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
      {/* Tag */}
      <EngineeringLabel
        x={length - 60}
        y={width - 12}
        text="FEED"
      />
    </>
  )
}

function AngleShape({
  length,
  width,
  angle,
}: {
  length: number
  width: number
  angle: number
}) {
  // Show the bend in the belt centerline within this module: belt enters
  // horizontally then exits at +angle. Two segments meeting at the module
  // midpoint give a visual hint of the incline.
  const cx = length / 2
  const cy = width / 2
  const rad = (angle * Math.PI) / 180
  const armLen = length / 2 - 20
  const x2 = cx + armLen * Math.cos(rad)
  const y2 = cy - armLen * Math.sin(rad)
  return (
    <>
      <ModuleBody length={length} width={width} />
      {/* Bend indication — heavy black outgoing arrow + dashed extension */}
      <Line
        points={[20, cy, cx, cy]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT * 2}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[cx, cy, x2, y2]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT * 2}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Small arc at the bend */}
      <Arc
        x={cx}
        y={cy}
        innerRadius={18}
        outerRadius={20}
        angle={angle}
        rotation={-angle}
        fill={INK}
        listening={false}
      />
      {/* Angle annotation */}
      <EngineeringLabel
        x={cx + 24}
        y={cy - 10}
        text={`${angle}°`}
      />
    </>
  )
}

function DriveShape({ length, width }: { length: number; width: number }) {
  const motorW = 130
  const motorH = 75
  const pulleyR = Math.min(20, width * 0.14)
  return (
    <>
      <ModuleBody length={length} width={width} />
      {/* Drive pulley shaft */}
      <Line
        points={[length - 14, -4, length - 14, width + 4]}
        stroke={INK}
        strokeWidth={OUTLINE_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Drive pulley (top view = circle around shaft) */}
      <Circle
        x={length - 14}
        y={width / 2}
        radius={pulleyR}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        fill={PAPER}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Circle
        x={length - 14}
        y={width / 2}
        radius={3}
        fill={INK}
        listening={false}
      />
      {/* Motor + gearbox housing (solid black = dense part in engineering drawings) */}
      <Rect
        x={length - motorW + 6}
        y={width + 4}
        width={motorW - 6}
        height={motorH}
        fill={MOTOR_FILL}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Cooling fins */}
      {Array.from({ length: 6 }, (_, i) => i + 1).map((i) => (
        <Line
          key={i}
          points={[
            length - motorW + 6 + (i * (motorW - 6)) / 7,
            width + 4,
            length - motorW + 6 + (i * (motorW - 6)) / 7,
            width + 4 + motorH,
          ]}
          stroke={INK_DIM}
          strokeWidth={DIM_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
      {/* Gearbox output cone */}
      <Line
        points={[
          length - 14,
          width,
          length - motorW + 14,
          width + 12,
        ]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[
          length - 14,
          width,
          length - motorW + 14,
          width - 4,
        ]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <EngineeringLabel
        x={length - motorW + 12}
        y={width + motorH - 6}
        text="M"
        size={16}
        color="#ffffff"
      />
    </>
  )
}

function LegShape({ length, width }: { length: number; width: number }) {
  // Aluminum extrusion top view: square with diagonal cross + center mark.
  return (
    <>
      <Rect
        x={0}
        y={0}
        width={length}
        height={width}
        fill={PAPER}
        stroke={INK}
        strokeWidth={OUTLINE_WEIGHT}
        strokeScaleEnabled={false}
      />
      <Line
        points={[2, 2, length - 2, width - 2]}
        stroke={INK_DIM}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[length - 2, 2, 2, width - 2]}
        stroke={INK_DIM}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Inner hollow (extrusion T-slot suggestion) */}
      <Rect
        x={length * 0.25}
        y={width * 0.25}
        width={length * 0.5}
        height={width * 0.5}
        stroke={INK}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
    </>
  )
}

function CastorShape({
  length,
  width,
  brake,
}: {
  length: number
  width: number
  brake: boolean
}) {
  const cx = length / 2
  const cy = width / 2
  const r = Math.min(length, width) * 0.42
  const plateInset = 6
  return (
    <>
      {/* Mounting plate (square base) */}
      <Rect
        x={plateInset}
        y={plateInset}
        width={length - plateInset * 2}
        height={width - plateInset * 2}
        fill={PAPER}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Bolt holes at the four corners */}
      {[
        [plateInset + 4, plateInset + 4],
        [length - plateInset - 4, plateInset + 4],
        [plateInset + 4, width - plateInset - 4],
        [length - plateInset - 4, width - plateInset - 4],
      ].map(([x, y], i) => (
        <Circle
          key={i}
          x={x as number}
          y={y as number}
          radius={2}
          stroke={INK}
          strokeWidth={DIM_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
      {/* Castor swivel base (circle) */}
      <Circle
        x={cx}
        y={cy}
        radius={r}
        fill={PAPER}
        stroke={INK}
        strokeWidth={OUTLINE_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Wheel itself (rectangle through the swivel) */}
      <Rect
        x={cx - r * 0.85}
        y={cy - r * 0.25}
        width={r * 1.7}
        height={r * 0.5}
        fill={MOTOR_FILL}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Hub */}
      <Circle
        x={cx}
        y={cy}
        radius={2.5}
        fill={PAPER}
        stroke={INK}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {brake && (
        <Rect
          x={cx - r * 0.4}
          y={cy + r - 2}
          width={r * 0.8}
          height={4}
          fill="#dc2626"
          stroke={INK}
          strokeWidth={DIM_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      )}
    </>
  )
}

/** Engineering-style text label — small caps, monospace-ish, dim. */
function EngineeringLabel({
  x,
  y,
  text,
  size = 11,
  color = INK,
}: {
  x: number
  y: number
  text: string
  size?: number
  color?: string
}) {
  return (
    <Text
      x={x}
      y={y}
      text={text}
      fontFamily="ui-monospace, Menlo, Consolas, monospace"
      fontSize={size}
      fontStyle="600"
      fill={color}
      listening={false}
    />
  )
}

/** Engineering dimension lines around a belt module (drawn outside the body). */
function Dimensions({ length, width }: { length: number; width: number }) {
  const off = 28 // dimension-line offset from body
  const tick = 6 // arrowhead/tick size
  return (
    <>
      {/* Length dimension above */}
      <Line
        points={[0, -off, length, -off]}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Extension lines */}
      <Line
        points={[0, -off + 6, 0, -2]}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[length, -off + 6, length, -2]}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Arrowheads (V marks) */}
      <Path
        data={`M ${tick} ${-off - tick / 1.5} L 0 ${-off} L ${tick} ${-off + tick / 1.5}`}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Path
        data={`M ${length - tick} ${-off - tick / 1.5} L ${length} ${-off} L ${length - tick} ${-off + tick / 1.5}`}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Text
        x={length / 2 - 32}
        y={-off - 16}
        text={`${length} mm`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={11}
        fontStyle="600"
        fill={SELECTED}
        listening={false}
      />

      {/* Width dimension right side */}
      <Line
        points={[length + off, 0, length + off, width]}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[length + 2, 0, length + off - 6, 0]}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[length + 2, width, length + off - 6, width]}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Path
        data={`M ${length + off - tick / 1.5} ${tick} L ${length + off} 0 L ${length + off + tick / 1.5} ${tick}`}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Path
        data={`M ${length + off - tick / 1.5} ${width - tick} L ${length + off} ${width} L ${length + off + tick / 1.5} ${width - tick}`}
        stroke={SELECTED}
        strokeWidth={DIM_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Text
        x={length + off + 6}
        y={width / 2 - 6}
        text={`${width}`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={11}
        fontStyle="600"
        fill={SELECTED}
        listening={false}
      />
    </>
  )
}
