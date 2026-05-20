import type { Link } from '../modules/types'
import { MODULES, modulePrice } from '../modules/registry'
import { computeChainGeometry } from './chainGeometry'

export type BomRow = {
  key: string
  label: string
  detail?: string
  qty: number
  unit: string
  unitPrice: number
  lineTotal: number
}

export type Bom = {
  rows: BomRow[]
  subtotal: number
  /** Footprint length (max projected horizontal span) in mm */
  footprintLengthMm: number
  /** Total belt path length in mm — sum of all link lengths */
  beltLengthMm: number
  /** Overall conveyor height in mm */
  heightMm: number
  /** Belt surface area in m² */
  beltAreaM2: number
  /** Number of legs auto-spec'd */
  legCount: number
}

const CHAIN_PRICE_PER_M = 145 // AUD/m for the modular belt chain
const FRAME_PRICE_PER_M = 95 // AUD/m for aluminium frame extrusion
const LEG_BASE_PRICE = 95 // AUD per vertical leg 40×40
const LEG_SPAN_MM = 1000 // place a leg pair every 1 m of path
const CASTOR_PRICE = 38 // AUD each (4 per leg pair-end)
const CASTOR_BRAKE_PRICE = 56
const VSD_PRICE = 620
const ESTOP_PRICE = 85
const FEED_SHIELD_BASE = 240
const FEED_SHIELD_PER_MM = 0.5

export function computeBom(
  links: Link[],
  conveyorWidthMm: number,
  drawing: {
    control?: string
    feedShield?: 'yes' | 'no'
  } = {},
): Bom {
  const geo = computeChainGeometry(links, conveyorWidthMm)

  const rows: BomRow[] = []
  let subtotal = 0

  const push = (row: BomRow) => {
    rows.push(row)
    subtotal += row.lineTotal
  }

  // 1. Belt modules (counted per kind)
  const counts = new Map<Link['kind'], number>()
  for (const l of links) counts.set(l.kind, (counts.get(l.kind) ?? 0) + 1)
  for (const [kind, qty] of counts) {
    const def = MODULES[kind]
    const unitPrice = modulePrice(kind, conveyorWidthMm)
    push({
      key: `mod-${kind}`,
      label: def.shortLabel,
      detail: `${def.length} mm @ ${conveyorWidthMm} mm width`,
      qty,
      unit: 'ea',
      unitPrice,
      lineTotal: unitPrice * qty,
    })
  }

  // 2. Modular belt chain — priced per linear meter of path
  const pathM = geo.pathLengthMm / 1000
  if (pathM > 0) {
    const chainTotal = pathM * CHAIN_PRICE_PER_M
    push({
      key: 'chain',
      label: 'Modular belt chain',
      detail: `${pathM.toFixed(2)} m × ${conveyorWidthMm} mm wide`,
      qty: Math.ceil(pathM * 100) / 100,
      unit: 'm',
      unitPrice: CHAIN_PRICE_PER_M,
      lineTotal: chainTotal,
    })
  }

  // 3. Frame extrusion — same path length, both sides
  if (pathM > 0) {
    const frameLenM = pathM * 2
    push({
      key: 'frame',
      label: 'Aluminium frame extrusion',
      detail: 'Both rails',
      qty: Math.ceil(frameLenM * 100) / 100,
      unit: 'm',
      unitPrice: FRAME_PRICE_PER_M,
      lineTotal: frameLenM * FRAME_PRICE_PER_M,
    })
  }

  // 4. Legs — every LEG_SPAN_MM, pair (two legs per support).
  //    For a non-empty chain we always have one set at each end too.
  const legPairs = links.length > 0 ? Math.max(2, Math.ceil(pathM)) : 0
  const legCount = legPairs * 2
  if (legCount > 0) {
    push({
      key: 'legs',
      label: 'Vertical leg 40×40',
      detail: `Pairs every ${LEG_SPAN_MM} mm`,
      qty: legCount,
      unit: 'ea',
      unitPrice: LEG_BASE_PRICE,
      lineTotal: legCount * LEG_BASE_PRICE,
    })
    // Castors — one per leg, two of them locking on the feed end
    const lockingQty = 2
    const freeQty = legCount - lockingQty
    if (lockingQty > 0) {
      push({
        key: 'castor-brake',
        label: 'Castor with brake',
        qty: lockingQty,
        unit: 'ea',
        unitPrice: CASTOR_BRAKE_PRICE,
        lineTotal: lockingQty * CASTOR_BRAKE_PRICE,
      })
    }
    if (freeQty > 0) {
      push({
        key: 'castor',
        label: 'Castor',
        qty: freeQty,
        unit: 'ea',
        unitPrice: CASTOR_PRICE,
        lineTotal: freeQty * CASTOR_PRICE,
      })
    }
  }

  // 5. Controls
  if (drawing.control === 'VSD + E-stop') {
    push({
      key: 'vsd',
      label: 'Variable speed drive',
      qty: 1,
      unit: 'ea',
      unitPrice: VSD_PRICE,
      lineTotal: VSD_PRICE,
    })
    push({
      key: 'estop',
      label: 'Emergency stop button',
      qty: 1,
      unit: 'ea',
      unitPrice: ESTOP_PRICE,
      lineTotal: ESTOP_PRICE,
    })
  }

  // 6. Feed shield (if a feed exists and shield is selected)
  const hasFeed = links.some((l) => MODULES[l.kind].role === 'feed')
  if (hasFeed && drawing.feedShield === 'yes') {
    const shieldPrice =
      FEED_SHIELD_BASE + FEED_SHIELD_PER_MM * Math.max(0, conveyorWidthMm - 100)
    push({
      key: 'feed-shield',
      label: 'Feed shield',
      detail: `${conveyorWidthMm} mm wide`,
      qty: 1,
      unit: 'ea',
      unitPrice: shieldPrice,
      lineTotal: shieldPrice,
    })
  }

  const beltAreaM2 = (geo.pathLengthMm * conveyorWidthMm) / 1_000_000

  return {
    rows,
    subtotal,
    footprintLengthMm: geo.footprintLengthMm,
    beltLengthMm: geo.pathLengthMm,
    heightMm: geo.heightMm,
    beltAreaM2,
    legCount,
  }
}

export function formatAud(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(n)
}

export function formatMm(mm: number): string {
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`
  return `${Math.round(mm)} mm`
}
