import * as XLSX from 'xlsx'
import { useStore } from './store'
import { computeBom } from './bom'

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}
function ymdDash(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function exportConveyorExcel(): void {
  const { links, conveyorWidth, drawing } = useStore.getState()
  const bom = computeBom(links, conveyorWidth, drawing)
  const today = new Date()

  // --- BOM sheet ---
  const bomRows: (string | number)[][] = [
    ['ConveyorDeck Quotation'],
    ['Drawing Title', drawing.title],
    ['Customer', drawing.customer],
    ['Drawing No.', drawing.drawingNumber],
    ['Date', ymdDash(today)],
    ['Conveyor Width', `${conveyorWidth} mm`],
    [],
    [],
    ['Item', 'Detail', 'Qty', 'Unit', 'Unit Price (AUD)', 'Line Total (AUD)'],
  ]
  for (const r of bom.rows) {
    bomRows.push([
      r.label,
      r.detail ?? '',
      r.qty,
      r.unit,
      r.unitPrice,
      r.lineTotal,
    ])
  }
  bomRows.push(['SUBTOTAL', '', '', '', '', bom.subtotal])

  const wsBom = XLSX.utils.aoa_to_sheet(bomRows)
  wsBom['!cols'] = [
    { wch: 30 },
    { wch: 28 },
    { wch: 8 },
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
  ]

  // --- Specs sheet ---
  const specsRows: (string | number)[][] = [
    ['Belt', drawing.belt],
    ['Motor', drawing.motor],
    ['Gearbox', drawing.gearbox],
    ['Control', drawing.control],
    ['Feed Shield', drawing.feedShield === 'yes' ? 'Yes' : 'No'],
    ['Width', `${conveyorWidth} mm`],
    [],
    ['Footprint length (mm)', Math.round(bom.footprintLengthMm)],
    ['Belt path length (mm)', Math.round(bom.beltLengthMm)],
    ['Overall height (mm)', Math.round(bom.heightMm)],
    ['Belt area (m²)', Number(bom.beltAreaM2.toFixed(2))],
    ['Leg count', bom.legCount],
  ]
  const wsSpecs = XLSX.utils.aoa_to_sheet(specsRows)
  wsSpecs['!cols'] = [{ wch: 26 }, { wch: 30 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsBom, 'BOM')
  XLSX.utils.book_append_sheet(wb, wsSpecs, 'Specs')

  const baseName = drawing.drawingNumber?.trim() || 'conveyor'
  const safe = baseName.replace(/[^a-zA-Z0-9_\-]+/g, '-')
  XLSX.writeFile(wb, `${safe}-${ymd(today)}.xlsx`)
}
