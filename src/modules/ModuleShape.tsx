import { Group, Rect, Line, Circle, Text, Arc } from 'react-konva'
import type { LinkGeometry } from '../lib/chainGeometry'
import { MODULES } from './registry'

const INK = '#0a0a0a'
const INK_DIM = '#525252'
const PAPER = '#ffffff'
const HATCH = '#737373'
const MOTOR_FILL = '#1f1f1f'
const SELECTED = '#ea580c'
const HOVER = '#ea580c33'

const OUTLINE_WEIGHT = 1.4
const DETAIL_WEIGHT = 0.6
const DIM_WEIGHT = 0.5

type Props = {
  geom: LinkGeometry
  selected: boolean
  onSelect: () => void
}

export function ModuleShape({ geom, selected, onSelect }: Props) {
  const def = MODULES[geom.kind]
  const { length, width } = geom

  return (
    <Group
      x={geom.x}
      y={geom.y}
      rotation={geom.heading}
      onClick={onSelect}
      onTap={onSelect}
      onMouseDown={onSelect}
    >
      {def.visual === 'feed' && <FeedShape length={length} width={width} />}
      {def.visual === 'plain' && <StraightShape length={length} width={width} />}
      {def.visual === 'angle-30' && (
        <AngleShape length={length} width={width} angle={30} variant={geom.variant} />
      )}
      {def.visual === 'angle-45' && (
        <AngleShape length={length} width={width} angle={45} variant={geom.variant} />
      )}
      {def.visual === 'drive' && <DriveShape length={length} width={width} />}

      {selected && (
        <Rect
          x={-4}
          y={-4}
          width={length + 8}
          height={width + 8}
          stroke={SELECTED}
          strokeWidth={1.4}
          dash={[6, 4]}
          fill={HOVER}
          listening={false}
          strokeScaleEnabled={false}
        />
      )}
    </Group>
  )
}

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
      {/* Upper and lower belt rails — represent the frame edges */}
      <Line
        points={[0, 12, length, 12]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[0, width - 12, length, width - 12]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* Belt centerline */}
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
  const hopX = 50
  const hopY = 18
  const hopW = length - hopX - 30
  const hopH = width - hopY * 2
  // hatch the hopper window
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
      <ModuleBody length={length} width={width} />
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
        x={6}
        y={6}
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

function AngleShape({
  length,
  width,
  angle,
  variant,
}: {
  length: number
  width: number
  angle: number
  variant: LinkGeometry['variant']
}) {
  // Variant 'incline-down' (positive heading change) flips the arc, 'incline-up' keeps it.
  const signedAngle = variant === 'incline-down' ? angle : -angle
  const cx = length / 2
  const cy = width / 2
  return (
    <>
      <ModuleBody length={length} width={width} />
      {/* arc indicating the change of direction */}
      <Arc
        x={cx}
        y={cy}
        innerRadius={width * 0.18}
        outerRadius={width * 0.22}
        angle={Math.abs(signedAngle)}
        rotation={signedAngle < 0 ? -Math.abs(signedAngle) : 0}
        fill={INK}
        listening={false}
      />
      <Text
        x={cx - 14}
        y={cy + width * 0.24}
        text={`${angle}°`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={12}
        fontStyle="700"
        fill={INK}
        listening={false}
      />
      <Text
        x={6}
        y={6}
        text={`BEND ${variant === 'incline-down' ? 'DN' : 'UP'}`}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSize={10}
        fontStyle="600"
        fill={INK}
        listening={false}
      />
    </>
  )
}

function DriveShape({ length, width }: { length: number; width: number }) {
  const motorW = 160
  const motorH = 75
  const pulleyR = Math.min(22, width * 0.18)
  return (
    <>
      <ModuleBody length={length} width={width} />
      {/* Drive pulley shaft (side view = circle at the head) */}
      <Circle
        x={length - 18}
        y={width / 2}
        radius={pulleyR}
        fill={PAPER}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Circle
        x={length - 18}
        y={width / 2}
        radius={3}
        fill={INK}
        listening={false}
      />
      {/* Motor + gearbox housing, hanging off the drive end */}
      <Rect
        x={length - motorW + 30}
        y={width + 6}
        width={motorW - 30}
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
            length - motorW + 30 + (i * (motorW - 30)) / 7,
            width + 6,
            length - motorW + 30 + (i * (motorW - 30)) / 7,
            width + 6 + motorH,
          ]}
          stroke={INK_DIM}
          strokeWidth={DIM_WEIGHT}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
      {/* Output shaft cone */}
      <Line
        points={[length - 18, width, length - motorW + 30, width + 12]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[length - 18, width, length - motorW + 30, width - 4]}
        stroke={INK}
        strokeWidth={DETAIL_WEIGHT}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Text
        x={length - motorW + 40}
        y={width + motorH * 0.5 - 8}
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
