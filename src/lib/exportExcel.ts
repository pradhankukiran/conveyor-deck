import * as XLSX from 'xlsx'
import { useStore } from '../lib/store'
import { computeBom } from '../lib/bom'

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function todayParts(): { iso: string; compact: string } {
  const d = new Date()
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  return { iso: `${y}-${m}-${day}`, compact: `${y}${m}${day}` }
}

export function exportConveyorExcel(): void {
  const { modules, conveyorWidth, drawing } = useStore.getState()
  const bom = computeBom(modules, conveyorWidth)
  const { iso, compact } = todayParts()

  // --- Sheet 1: BOM ---
  const bomAoa: (string | number)[][] = [
    ['ConveyorDeck Quotation'],
    ['Drawing Title', drawing.title],
    ['Customer', drawing.customer],
    ['Drawing No.', drawing.drawingNumber],
    ['Date', iso],
    ['Conveyor Width', `${conveyorWidth} mm`],
    [],
    [],
    ['Item', 'Group', 'Qty', 'Unit Price (AUD)', 'Line Total (AUD)'],
  ]

  for (const row of bom.rows) {
    bomAoa.push([row.label, row.group, row.qty, row.unitPrice, row.lineTotal])
  }

  bomAoa.push(['TOTAL', '', '', '', bom.total])

  const bomSheet = XLSX.utils.aoa_to_sheet(bomAoa)
  bomSheet['!cols'] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
  ]

  // --- Sheet 2: Specs ---
  const specsAoa: (string | number)[][] = [
    ['Belt', drawing.belt],
    ['Motor', drawing.motor],
    ['Gearbox', drawing.gearbox],
    ['Control', drawing.control],
    ['Feed Shield', drawing.feedShield === 'yes' ? 'Yes' : 'No'],
    ['Width', `${conveyorWidth} mm`],
  ]

  const specsSheet = XLSX.utils.aoa_to_sheet(specsAoa)
  specsSheet['!cols'] = [{ wch: 20 }, { wch: 30 }]

  // --- Workbook ---
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, bomSheet, 'BOM')
  XLSX.utils.book_append_sheet(workbook, specsSheet, 'Specs')

  const base = drawing.drawingNumber || 'conveyor'
  const filename = `${base}-${compact}.xlsx`

  XLSX.writeFile(workbook, filename)
}
