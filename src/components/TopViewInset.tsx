import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { computeChainGeometry } from '../lib/chainGeometry'
import { MODULES } from '../modules/registry'

const SVG_W = 280
const SVG_H = 88
const PAD = 10
const STRIP_H = 24

/**
 * Small overlay showing the conveyor as seen from above — a single linear
 * strip running between the feed and the drive. Lines mark each angle
 * module since bends don't render in a top view.
 */
export function TopViewInset() {
  const links = useStore((s) => s.links)
  const conveyorWidth = useStore((s) => s.conveyorWidth)

  const geo = useMemo(
    () => computeChainGeometry(links, conveyorWidth),
    [links, conveyorWidth],
  )

  if (geo.links.length === 0 || !geo.bounds) return null

  const footprint = Math.max(1, geo.footprintLengthMm)
  const innerW = SVG_W - PAD * 2
  const xScale = innerW / footprint
  const stripY = (SVG_H - STRIP_H) / 2
  const minX = geo.bounds.x
  const toSvgX = (wx: number) => PAD + (wx - minX) * xScale

  // Compute each link's footprint extent in world coords (projected x-range)
  const linkRanges = geo.links.map((l) => {
    const xs = l.corners.map((c) => c.x)
    return { kind: l.kind, x0: Math.min(...xs), x1: Math.max(...xs) }
  })

  return (
    <div className="pointer-events-auto absolute top-3 left-3 rounded-md border border-stone-200 bg-white/95 px-3 pb-2 pt-1.5 shadow-sm backdrop-blur">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Top view
        </span>
        <span className="font-mono text-[10px] text-stone-500">
          {Math.round(footprint)} × {conveyorWidth} mm
        </span>
      </div>
      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        {/* Outer belt strip */}
        <rect
          x={PAD}
          y={stripY}
          width={innerW}
          height={STRIP_H}
          fill="#ffffff"
          stroke="#0a0a0a"
          strokeWidth={0.8}
        />
        {/* Belt centerline */}
        <line
          x1={PAD}
          y1={stripY + STRIP_H / 2}
          x2={SVG_W - PAD}
          y2={stripY + STRIP_H / 2}
          stroke="#525252"
          strokeWidth={0.5}
          strokeDasharray="6 2 1 2"
        />
        {/* Belt rails (above and below) */}
        <line
          x1={PAD}
          y1={stripY + 3}
          x2={SVG_W - PAD}
          y2={stripY + 3}
          stroke="#0a0a0a"
          strokeWidth={0.4}
        />
        <line
          x1={PAD}
          y1={stripY + STRIP_H - 3}
          x2={SVG_W - PAD}
          y2={stripY + STRIP_H - 3}
          stroke="#0a0a0a"
          strokeWidth={0.4}
        />

        {linkRanges.map((r, i) => {
          const def = MODULES[r.kind]
          const x0 = toSvgX(r.x0)
          const x1 = toSvgX(r.x1)
          const w = Math.max(1, x1 - x0)
          if (def.role === 'feed') {
            // Hopper marker
            return (
              <g key={i}>
                <rect
                  x={x0 + 1}
                  y={stripY + 3}
                  width={w - 2}
                  height={STRIP_H - 6}
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth={0.4}
                />
                {[0.2, 0.5, 0.8].map((t) => (
                  <line
                    key={t}
                    x1={x0 + w * t}
                    y1={stripY + 4}
                    x2={x0 + w * (t + 0.1)}
                    y2={stripY + STRIP_H - 4}
                    stroke="#737373"
                    strokeWidth={0.4}
                  />
                ))}
              </g>
            )
          }
          if (def.role === 'drive') {
            // Drive head — solid dark cap + pulley
            return (
              <g key={i}>
                <rect
                  x={x1 - 8}
                  y={stripY + 1}
                  width={6}
                  height={STRIP_H - 2}
                  fill="#1f1f1f"
                />
                <circle
                  cx={x1 - 5}
                  cy={stripY + STRIP_H / 2}
                  r={STRIP_H * 0.18}
                  fill="#ffffff"
                  stroke="#0a0a0a"
                  strokeWidth={0.4}
                />
                <rect
                  x={x1 + 1}
                  y={stripY + STRIP_H - 1}
                  width={5}
                  height={5}
                  fill="#1f1f1f"
                />
              </g>
            )
          }
          if (def.role === 'angle') {
            // Bend lines crossing the strip
            return (
              <g key={i}>
                <line
                  x1={x0}
                  y1={stripY - 4}
                  x2={x0}
                  y2={stripY + STRIP_H + 4}
                  stroke="#0a0a0a"
                  strokeWidth={0.6}
                  strokeDasharray="3 2"
                />
                <line
                  x1={x1}
                  y1={stripY - 4}
                  x2={x1}
                  y2={stripY + STRIP_H + 4}
                  stroke="#0a0a0a"
                  strokeWidth={0.6}
                  strokeDasharray="3 2"
                />
                <text
                  x={(x0 + x1) / 2}
                  y={stripY - 6}
                  textAnchor="middle"
                  fontSize={7}
                  fontFamily="ui-monospace, monospace"
                  fontWeight="700"
                  fill="#0a0a0a"
                >
                  {def.bendDeg}°
                </text>
              </g>
            )
          }
          return null
        })}

        {/* Dimension ticks at the ends */}
        <line
          x1={PAD}
          y1={SVG_H - 4}
          x2={SVG_W - PAD}
          y2={SVG_H - 4}
          stroke="#525252"
          strokeWidth={0.5}
        />
        <line
          x1={PAD}
          y1={SVG_H - 8}
          x2={PAD}
          y2={SVG_H - 1}
          stroke="#525252"
          strokeWidth={0.5}
        />
        <line
          x1={SVG_W - PAD}
          y1={SVG_H - 8}
          x2={SVG_W - PAD}
          y2={SVG_H - 1}
          stroke="#525252"
          strokeWidth={0.5}
        />
      </svg>
    </div>
  )
}
