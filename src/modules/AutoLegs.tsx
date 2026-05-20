import { Group, Line, Rect, Circle } from 'react-konva'
import type { ChainGeometry, Pt } from '../lib/chainGeometry'
import { sampleCenterline } from '../lib/chainGeometry'

const INK = '#0a0a0a'
const INK_DIM = '#525252'
const CASTOR = '#1f1f1f'
const FLOOR = '#a8a29e'

const LEG_SPACING_MM = 1000
const LEG_WIDTH = 40
const CASTOR_R = 35
const FLOOR_CLEARANCE = 30

/**
 * Drops a perpendicular "below" the belt at heading H.
 * Screen y is down; ground side has the larger y component.
 */
function perpBelow(headingDeg: number, distance: number): Pt {
  const r = (headingDeg * Math.PI) / 180
  return { x: -distance * Math.sin(r), y: distance * Math.cos(r) }
}

function add(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y }
}

type Props = {
  geo: ChainGeometry
}

export function AutoLegs({ geo }: Props) {
  if (geo.links.length === 0 || !geo.bounds) return null

  const widthAt = (sampleIdx: number, n: number): number => {
    // Lookup the link at the sample distance — use first link width as a proxy.
    void sampleIdx
    void n
    return geo.links[0]?.width ?? 600
  }

  const samples = sampleCenterline(geo, LEG_SPACING_MM)
  if (samples.length === 0) return null

  // Compute the per-sample "below-rail" attach point (where the leg connects
  // to the belt frame). Leg drops straight down (screen +y) from there to
  // a single floor level shared across the conveyor.
  const W = widthAt(0, samples.length)
  const tops = samples.map((s) =>
    add(s.pos, perpBelow(s.heading, W / 2 - 4)),
  )

  // Floor: a bit below the lowest belt-rail point in the whole conveyor.
  const lowestBelt = Math.max(
    ...geo.links.flatMap((l) => l.corners.map((c) => c.y)),
  )
  const floor = lowestBelt + FLOOR_CLEARANCE + CASTOR_R + 80

  return (
    <Group listening={false}>
      {/* Floor line spanning the conveyor footprint */}
      <Line
        points={[geo.bounds.x - 100, floor, geo.bounds.x + geo.bounds.width + 100, floor]}
        stroke={FLOOR}
        strokeWidth={0.8}
        strokeScaleEnabled={false}
        dash={[8, 6]}
      />
      {tops.map((top, i) => {
        const isEnd = i === 0 || i === tops.length - 1
        const isFeedEnd = i === 0
        const legBottom = floor - CASTOR_R - 4
        // Skip legs whose top is below the floor (shouldn't happen in normal layouts).
        if (top.y > legBottom) return null
        return (
          <Group key={i}>
            {/* Vertical extrusion leg */}
            <Rect
              x={top.x - LEG_WIDTH / 2}
              y={top.y}
              width={LEG_WIDTH}
              height={legBottom - top.y}
              fill="#ffffff"
              stroke={INK}
              strokeWidth={0.7}
              strokeScaleEnabled={false}
            />
            {/* T-slot dimples down the leg */}
            <Line
              points={[top.x, top.y + 8, top.x, legBottom - 4]}
              stroke={INK_DIM}
              strokeWidth={0.4}
              strokeScaleEnabled={false}
            />
            {/* Castor (or castor-with-brake at the feed end) */}
            <Castor
              cx={top.x}
              cy={legBottom + CASTOR_R - 6}
              brake={isEnd && isFeedEnd}
            />
          </Group>
        )
      })}
    </Group>
  )
}

function Castor({
  cx,
  cy,
  brake,
}: {
  cx: number
  cy: number
  brake: boolean
}) {
  return (
    <>
      <Circle
        x={cx}
        y={cy}
        radius={CASTOR_R}
        fill="#ffffff"
        stroke={INK}
        strokeWidth={0.8}
        strokeScaleEnabled={false}
      />
      <Rect
        x={cx - CASTOR_R * 0.75}
        y={cy - CASTOR_R * 0.18}
        width={CASTOR_R * 1.5}
        height={CASTOR_R * 0.36}
        fill={CASTOR}
        stroke={INK}
        strokeWidth={0.5}
        strokeScaleEnabled={false}
      />
      <Circle
        x={cx}
        y={cy}
        radius={CASTOR_R * 0.16}
        fill="#ffffff"
        stroke={INK}
        strokeWidth={0.4}
        strokeScaleEnabled={false}
      />
      {brake && (
        <Rect
          x={cx - CASTOR_R * 0.7}
          y={cy + CASTOR_R - 3}
          width={CASTOR_R * 1.4}
          height={6}
          fill="#dc2626"
          stroke={INK}
          strokeWidth={0.4}
          strokeScaleEnabled={false}
        />
      )}
    </>
  )
}
