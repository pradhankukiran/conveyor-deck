import { Group, Rect, Line, Circle, Text, Arc } from 'react-konva'
import type Konva from 'konva'
import type { ModuleInstance } from './types'
import { MODULES } from './registry'

const COLORS = {
  body: '#fef3c7',
  bodyAccent: '#fcd34d',
  belt: '#a8a29e',
  outline: '#292524',
  selected: '#ea580c',
  motor: '#0c4a6e',
  motorAccent: '#0369a1',
  hopper: '#fbbf24',
  leg: '#78716c',
  castor: '#1c1917',
  badge: '#1c1917',
}

type Props = {
  instance: ModuleInstance
  conveyorWidth: number
  selected: boolean
  onSelect: () => void
  onDragMove: (x: number, y: number) => void
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
    onDragMove(e.target.x(), e.target.y())
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
        <Rect
          x={-3}
          y={-3}
          width={length + 6}
          height={width + 6}
          stroke={COLORS.selected}
          strokeWidth={2}
          dash={[6, 4]}
          listening={false}
          strokeScaleEnabled={false}
        />
      )}
    </Group>
  )
}

function BeltBody({
  length,
  width,
  fill = COLORS.body,
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
        stroke={COLORS.outline}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        cornerRadius={3}
      />
      <Line
        points={[0, width / 2, length, width / 2]}
        stroke={COLORS.belt}
        strokeWidth={0.8}
        dash={[8, 6]}
        listening={false}
        strokeScaleEnabled={false}
      />
    </>
  )
}

function StraightShape({ length, width }: { length: number; width: number }) {
  return <BeltBody length={length} width={width} />
}

function FeedShape({ length, width }: { length: number; width: number }) {
  const hopperInset = Math.min(60, width * 0.15)
  const hopperLen = Math.min(180, length * 0.5)
  return (
    <>
      <BeltBody length={length} width={width} />
      <Rect
        x={length - hopperLen - 20}
        y={hopperInset}
        width={hopperLen}
        height={width - hopperInset * 2}
        fill={COLORS.hopper}
        opacity={0.35}
        stroke={COLORS.outline}
        strokeWidth={1}
        strokeScaleEnabled={false}
        cornerRadius={2}
      />
      <Text
        x={8}
        y={6}
        text="FEED"
        fontSize={14}
        fontStyle="600"
        fill={COLORS.outline}
        listening={false}
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
  return (
    <>
      <BeltBody length={length} width={width} fill={COLORS.bodyAccent} />
      <Arc
        x={length / 2}
        y={width / 2}
        innerRadius={Math.min(width, length) * 0.18}
        outerRadius={Math.min(width, length) * 0.32}
        angle={angle}
        rotation={-angle / 2 - 90}
        fill={COLORS.badge}
        opacity={0.85}
        listening={false}
      />
      <Text
        x={length / 2 - 22}
        y={width / 2 - 8}
        text={`${angle}°`}
        fontSize={16}
        fontStyle="700"
        fill="#fff"
        listening={false}
      />
    </>
  )
}

function DriveShape({ length, width }: { length: number; width: number }) {
  const motorBoxW = 110
  const motorBoxH = 70
  return (
    <>
      <BeltBody length={length} width={width} />
      {/* drive pulley shaft */}
      <Line
        points={[length - 10, -8, length - 10, width + 8]}
        stroke={COLORS.outline}
        strokeWidth={2}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Circle
        x={length - 10}
        y={width / 2}
        radius={Math.min(18, width * 0.12)}
        fill="#fff"
        stroke={COLORS.outline}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        listening={false}
      />
      {/* motor box */}
      <Rect
        x={length - motorBoxW + 10}
        y={width + 8}
        width={motorBoxW}
        height={motorBoxH}
        fill={COLORS.motor}
        stroke={COLORS.outline}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        cornerRadius={3}
        listening={false}
      />
      <Rect
        x={length - motorBoxW + 22}
        y={width + 20}
        width={motorBoxW - 24}
        height={motorBoxH - 24}
        fill={COLORS.motorAccent}
        strokeScaleEnabled={false}
        cornerRadius={2}
        listening={false}
      />
      <Text
        x={length - motorBoxW + 24}
        y={width + 26}
        text="M"
        fontSize={28}
        fontStyle="700"
        fill="#fff"
        listening={false}
      />
    </>
  )
}

function LegShape({ length, width }: { length: number; width: number }) {
  return (
    <>
      <Rect
        x={0}
        y={0}
        width={length}
        height={width}
        fill={COLORS.leg}
        stroke={COLORS.outline}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        cornerRadius={2}
      />
      {/* extrusion cross marks */}
      <Line
        points={[0, 0, length, width]}
        stroke={COLORS.outline}
        strokeWidth={0.8}
        opacity={0.5}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[length, 0, 0, width]}
        stroke={COLORS.outline}
        strokeWidth={0.8}
        opacity={0.5}
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
  return (
    <>
      <Circle
        x={cx}
        y={cy}
        radius={r}
        fill={COLORS.castor}
        stroke={COLORS.outline}
        strokeWidth={1}
        strokeScaleEnabled={false}
      />
      <Circle
        x={cx}
        y={cy}
        radius={r * 0.35}
        fill="#fff"
        listening={false}
      />
      {brake && (
        <Rect
          x={cx - r * 0.6}
          y={cy + r - 4}
          width={r * 1.2}
          height={8}
          fill="#dc2626"
          strokeScaleEnabled={false}
          listening={false}
        />
      )}
    </>
  )
}
