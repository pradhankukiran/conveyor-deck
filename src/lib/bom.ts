import type { ModuleInstance, ModuleKind } from '../modules/types'
import { MODULES, MODULE_ORDER, modulePrice } from '../modules/registry'

export type BomRow = {
  kind: ModuleKind
  label: string
  group: 'belt' | 'support' | 'control'
  qty: number
  unitPrice: number
  lineTotal: number
}

export type Bom = {
  rows: BomRow[]
  total: number
}

export function computeBom(modules: ModuleInstance[], widthMm: number): Bom {
  const counts = new Map<ModuleKind, number>()
  for (const m of modules) {
    counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1)
  }

  const rows: BomRow[] = []
  let total = 0
  for (const [kind, qty] of counts) {
    const def = MODULES[kind]
    const unitPrice = modulePrice(kind, widthMm)
    const lineTotal = unitPrice * qty
    rows.push({
      kind,
      label: def.shortLabel,
      group: def.group,
      qty,
      unitPrice,
      lineTotal,
    })
    total += lineTotal
  }

  rows.sort(
    (a, b) => MODULE_ORDER.indexOf(a.kind) - MODULE_ORDER.indexOf(b.kind),
  )
  return { rows, total }
}

export function formatAud(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(n)
}
