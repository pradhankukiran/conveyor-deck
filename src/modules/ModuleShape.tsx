import { Group, Line, Rect, Circle, Text, Arc } from 'react-konva'
import type { LinkGeometry, Pt } from '../lib/chainGeometry'
import { MODULES } from './registry'

const INK = '#0a0a0a'
const INK_DIM = '#525252'
const PAPER = '#ffffff'
const HATCH = '#737373'
const MOTOR_FILL = '#1f1f1f'
const SELECTED = '#ea580c'
const SELECTED_FILL = '#ea580c33'

const OUTLINE_WEIGHT = 1.4
const DETAIL_WEIGHT = 0.6
const DIM_WEIGHT = 0.5

type Props = {
  geom: LinkGeometry
  selected: boolean
  onSelect: () => void
}

function flatten(pts: Pt[]): number[] {
  const out: number[] = []
  for (const p of pts) {
    out.push(p.x, p.y)
  }
  return out
}

export function ModuleShape({ geom, selected, onSelect }: Props) {
  const def = MODULES[geom.kind]
  const outline = flatten(geom.corners)
  const isAngle = def.role === 'angle'

  const handleSelect = (e: { cancelBubble: boolean }) => {
    e.cancelBubble = true
    onSelect()
  }

  return (
    <Group>
      {/* Outline polygon — owns the click target for this module */}
      <Line
        points={outline}
        closed
        fill={PAPER}
        stroke={INK}
        strokeWidth={OUTLINE_WEIGHT}
        strokeScaleEnabled={false}
        onClick={handleSelect}
        onTap={handleSelect}
        onMouseDown={handleSelect}
      />

      {/* Belt centerline — the chord */}
      <Line
        points={[
          geom.centerEntry.x,
          geom.centerEntry.y,
          geom.centerExit.x,
          geom.centerExit.y,
        ]}
        stroke={INK_DIM}
        strokeWidth={DIM_WEIGHT}
        dash={[18, 4, 3, 4]}
        strokeScaleEnabled={false}
        listening={false}
      />

      {/* Belt rails — two parallel offset lines on either side of the chord */}
      <RailPair geom={geom} inset={12} />

      {/* Module-specific interior detail. For non-angle modules we use a
          rotated local frame so the detail lines up with the rectangular
          outline. Angle modules use world-coord annotations because their
          outline is a trapezoid that doesn't match a single local rotation. */}
      {!isAngle && (
        <Group
          x={geom.centerEntry.x}
          y={geom.centerEntry.y}
          rotation={geom.chordHeading}
        >
          {def.visual === 'plain' && (
            <ChainPattern length={geom.length} width={geom.width} />
          )}
          {def.visual === 'feed' && (
            <FeedInterior length={geom.length} width={geom.width} />
          )}
          {def.visual === 'drive' && (
            <DriveInterior length={geom.length} width={geom.width} />
          )}
        </Group>
      )}

      {isAngle && (
        <AngleInterior
          geom={geom}
          bendDeg={def.bendDeg ?? 0}
        />
      )}

      {selected && (
        <Line
          points={outline}
          closed
          fill={SELECTED_FILL}
          stroke={SELECTED}
          strokeWidth={3}
          dash={[10, 6]}
          strokeScaleEnabled={false}
          listening={false}
          shadowColor={SELECTED}
          shadowBlur={8}
          shadowOpacity={0.6}
        />
      )}
    </Group>
  )
}

function RailPair({
  geom,
  inset,
}: {
  geom: LinkGeometry
  inset: number
}) {
  // The rails run from a point inset from entryAbove toward exitAbove, and
  // similarly on the below side. We interpolate from corner to corner.
  const [entryAbove, exitAbove, exitBelow, entryBelow] = geom.corners
  const aboveStart = interpolate(entryAbove, entryBelow, inset / geom.width)
  const aboveEnd = interpolate(exitAbove, exitBelow, inset / geom.width)
  const belowStart = interpolate(entryBelow, entryAbove, inset / geom.width)
  const belowEnd = interpolate(exitBelow, exitAbove, inset / geom.width)
  return (
    <>
      <Line
        points={[aboveStart.x, aboveStart.y, aboveEnd.x, aboveEnd.y]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[belowStart.x, belowStart.y, belowEnd.x, belowEnd.y]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
    </>
  )
}

function interpolate(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function ChainPattern({
  length,
  width,
  pitch = 60,
  inset = 12,
}: {
  length: number
  width: number
  pitch?: number
  inset?: number
}) {
  const xs: number[] = []
  for (let x = pitch; x < length; x += pitch) xs.push(x)
  return (
    <>
      {xs.map((x) => (
        <Line
          key={x}
          points={[x, -width / 2 + inset, x, width / 2 - inset]}
          stroke={INK_DIM}
          strokeWidth={DETAIL_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
    </>
  )
}

function FeedInterior({ length, width }: { length: number; width: number }) {
  const hopX = 70
  const hopY = -width / 2 + 18
  const hopW = length - hopX - 40
  const hopH = width - 36
  const hatchSpacing = 9
  const hatch: number[][] = []
  for (let off = -hopH; off < hopW; off += hatchSpacing) {
    const x1 = Math.max(0, off)
    const y1 = Math.max(0, -off)
    const x2 = Math.min(hopW, off + hopH)
    const y2 = Math.min(hopH, hopW - off + (hopH - hopW))
    if (x2 > x1) hatch.push([hopX + x1, hopY + y1, hopX + x2, hopY + y2])
  }
  return (
    <>
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
      {hatch.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          stroke={HATCH}
          strokeWidth={DIM_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
      <Text
        x={8}
        y={-width / 2 + 6}
        text="FEED"
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={11}
        fontStyle="600"
        fill={INK}
        listening={false}
      />
    </>
  )
}

function DriveInterior({ length, width }: { length: number; width: number }) {
  const motorW = 160
  const motorH = 75
  const pulleyR = Math.min(22, width * 0.18)
  return (
    <>
      <Circle
        x={length - 18}
        y={0}
        radius={pulleyR}
        fill={PAPER}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Circle
        x={length - 18}
        y={0}
        radius={3}
        fill={INK}
        listening={false}
      />
      <Rect
        x={length - motorW + 30}
        y={width / 2 + 6}
        width={motorW - 30}
        height={motorH}
        fill={MOTOR_FILL}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {Array.from({ length: 6 }, (_, i) => i + 1).map((i) => (
        <Line
          key={i}
          points={[
            length - motorW + 30 + (i * (motorW - 30)) / 7,
            width / 2 + 6,
            length - motorW + 30 + (i * (motorW - 30)) / 7,
            width / 2 + 6 + motorH,
          ]}
          stroke={INK_DIM}
          strokeWidth={DIM_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
      <Line
        points={[length - 18, width / 2, length - motorW + 30, width / 2 + 12]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[length - 18, width / 2, length - motorW + 30, width / 2 - 4]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Text
        x={length - motorW + 40}
        y={width / 2 + motorH * 0.4}
        text="M"
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={20}
        fontStyle="700"
        fill="#ffffff"
        listening={false}
      />
    </>
  )
}

function AngleInterior({
  geom,
  bendDeg,
}: {
  geom: LinkGeometry
  bendDeg: number
}) {
  // Center of the trapezoid: midpoint of the chord
  const cx = (geom.centerEntry.x + geom.centerExit.x) / 2
  const cy = (geom.centerEntry.y + geom.centerExit.y) / 2
  const dirLabel = geom.variant === 'incline-down' ? 'DN' : 'UP'
  // Determine arc rotation: visualise the entry → exit sweep around the
  // chord midpoint. Just show a small wedge for direction cue.
  const arcStart = geom.variant === 'incline-down' ? -bendDeg / 2 : -90
  return (
    <>
      <Arc
        x={cx}
        y={cy}
        innerRadius={geom.width * 0.18}
        outerRadius={geom.width * 0.22}
        angle={bendDeg}
        rotation={arcStart}
        fill={INK}
        listening={false}
      />
      <Text
        x={cx - 14}
        y={cy + geom.width * 0.26}
        text={`${bendDeg}°`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={12}
        fontStyle="700"
        fill={INK}
        listening={false}
      />
      <Text
        x={geom.corners[0].x + 8}
        y={geom.corners[0].y + 6}
        text={`BEND ${dirLabel}`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={10}
        fontStyle="600"
        fill={INK}
        rotation={geom.chordHeading}
        listening={false}
      />
    </>
  )
}
