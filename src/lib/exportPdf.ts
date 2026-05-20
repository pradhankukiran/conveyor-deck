import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useStore } from './store'
import { snapshotStage } from './stageHandle'
import { computeBom, formatAud } from './bom'
import { MODULES } from '../modules/registry'
import type { ModuleInstance } from '../modules/types'

type Bbox = { x: number; y: number; width: number; height: number }

/** Visual width of a module instance in world space (mm). */
function moduleWidth(m: ModuleInstance, conveyorWidth: number): number {
  const def = MODULES[m.kind]
  if (def.matchesConveyorWidth) return conveyorWidth
  return def.fixedWidth ?? 100
}

/**
 * Axis-aligned bounding box of all placed modules in world space.
 * Each module is treated as a length × width rectangle anchored at (m.x, m.y),
 * rotated about that anchor by m.rotation degrees.
 */
function worldBboxOfModules(
  modules: ModuleInstance[],
  conveyorWidth: number,
): Bbox | null {
  if (modules.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const m of modules) {
    const def = MODULES[m.kind]
    const len = def.length
    const wid = moduleWidth(m, conveyorWidth)
    const theta = (m.rotation * Math.PI) / 180
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)

    // Local corners (0,0), (len,0), (len,wid), (0,wid) rotated about origin then translated.
    const corners = [
      [0, 0],
      [len, 0],
      [len, wid],
      [0, wid],
    ]
    for (const [lx, ly] of corners) {
      const wx = m.x + (lx as number) * cos - (ly as number) * sin
      const wy = m.y + (lx as number) * sin + (ly as number) * cos
      if (wx < minX) minX = wx
      if (wy < minY) minY = wy
      if (wx > maxX) maxX = wx
      if (wy > maxY) maxY = wy
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function formatDateDisplay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${day}/${m}/${y}`
}

/**
 * Extract intrinsic pixel size from a PNG data URL using the IHDR chunk.
 * Returns null if it can't be parsed.
 */
function pngSizeFromDataUrl(
  dataUrl: string,
): { width: number; height: number } | null {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return null
  try {
    const b64 = dataUrl.slice(comma + 1)
    const bin = atob(b64)
    // PNG signature is 8 bytes, then IHDR chunk: length(4) + 'IHDR'(4) + width(4) + height(4)
    if (bin.length < 24) return null
    const readU32 = (o: number) =>
      (bin.charCodeAt(o) << 24) |
      (bin.charCodeAt(o + 1) << 16) |
      (bin.charCodeAt(o + 2) << 8) |
      bin.charCodeAt(o + 3)
    const width = readU32(16) >>> 0
    const height = readU32(20) >>> 0
    if (!width || !height) return null
    return { width, height }
  } catch {
    return null
  }
}

export async function exportConveyorPdf(): Promise<void> {
  const { modules, conveyorWidth, drawing } = useStore.getState()

  // ---- 1. Snapshot the canvas (tight crop around modules) -----------------
  const bbox = worldBboxOfModules(modules, conveyorWidth)
  const imageDataUrl = bbox
    ? snapshotStage({ worldBox: bbox, pixelRatio: 2, padding: 80 })
    : null

  // ---- 2. BOM aggregation -------------------------------------------------
  const bom = computeBom(modules, conveyorWidth)

  // ---- 3. PDF document ----------------------------------------------------
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  })

  // A3 landscape page dimensions in mm.
  const pageW = 420
  const pageH = 297
  const borderInset = 8

  // Outer engineering border.
  doc.setLineWidth(0.6)
  doc.setDrawColor(0, 0, 0)
  doc.rect(
    borderInset,
    borderInset,
    pageW - borderInset * 2,
    pageH - borderInset * 2,
  )

  // ---- Title block (bottom-right) ----------------------------------------
  const tbW = 200
  const tbH = 60
  const tbX = pageW - borderInset - tbW
  const tbY = pageH - borderInset - tbH

  doc.setLineWidth(0.4)
  doc.rect(tbX, tbY, tbW, tbH)

  // Title block grid: 4 rows × varying columns. Row heights from top to bottom.
  const rowH = tbH / 4 // 15 mm per row
  // Vertical lines: at fixed x offsets within the title block.
  // Layout (left to right):
  //   col 0: label/value pair (Drawing Title / Customer / Drawn by / Date)   width 90
  //   col 1: second label/value pair (Drawing No / Conveyor W / Belt / Motor) width 80
  //   col 2: "ConveyorDeck" wordmark + 3rd angle projection                   width 30
  const col0W = 90
  const col1W = 80
  const col2W = tbW - col0W - col1W // 30

  // Draw horizontal lines between rows.
  for (let i = 1; i < 4; i++) {
    const y = tbY + i * rowH
    doc.line(tbX, y, tbX + col0W + col1W, y) // only across the data columns
  }

  // Draw vertical lines.
  doc.line(tbX + col0W, tbY, tbX + col0W, tbY + tbH)
  doc.line(tbX + col0W + col1W, tbY, tbX + col0W + col1W, tbY + tbH)

  // Cells in the data area each have a small label strip on top and value below.
  // To keep things tidy we use a single line per cell with bold label, normal value.
  type Cell = { label: string; value: string }
  const now = new Date()
  const leftCells: Cell[] = [
    { label: 'Drawing Title', value: drawing.title || '—' },
    { label: 'Customer', value: drawing.customer || '—' },
    { label: 'Drawn by', value: 'ConveyorDeck' },
    { label: 'Date', value: formatDateDisplay(now) },
  ]
  const rightCells: Cell[] = [
    { label: 'Drawing No.', value: drawing.drawingNumber || '—' },
    { label: 'Conveyor Width', value: `${conveyorWidth} mm` },
    { label: 'Belt', value: drawing.belt || '—' },
    { label: 'Motor', value: drawing.motor || '—' },
  ]

  const drawCell = (
    x: number,
    y: number,
    w: number,
    h: number,
    cell: Cell,
  ) => {
    // Label, top-left, tiny.
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(90, 90, 90)
    doc.text(cell.label.toUpperCase(), x + 2, y + 3.5)

    // Value, centered-left, bolder.
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const value =
      doc.getTextWidth(cell.value) > w - 4
        ? truncateToWidth(doc, cell.value, w - 4)
        : cell.value
    doc.text(value, x + 2, y + h - 3.5)
  }

  for (let i = 0; i < 4; i++) {
    drawCell(tbX, tbY + i * rowH, col0W, rowH, leftCells[i]!)
    drawCell(tbX + col0W, tbY + i * rowH, col1W, rowH, rightCells[i]!)
  }

  // Right-most column: wordmark + projection symbol text.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('ConveyorDeck', tbX + col0W + col1W + col2W / 2, tbY + tbH / 2 - 2, {
    align: 'center',
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(60, 60, 60)
  doc.text(
    '3RD ANGLE PROJECTION',
    tbX + col0W + col1W + col2W / 2,
    tbY + tbH / 2 + 4,
    { align: 'center' },
  )
  doc.text(
    'ALL DIMS IN MM',
    tbX + col0W + col1W + col2W / 2,
    tbY + tbH / 2 + 9,
    { align: 'center' },
  )

  // ---- Notes box (bottom-left) -------------------------------------------
  const nbW = 90
  const nbH = 32
  const nbX = borderInset + 4
  const nbY = pageH - borderInset - nbH - 2

  doc.setLineWidth(0.4)
  doc.rect(nbX, nbY, nbW, nbH)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text('NOTES', nbX + 2, nbY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const notes = [
    '1- Flight height',
    '2- Flight space',
    `3- Feed Shield  ${drawing.feedShield === 'yes' ? 'YES' : 'NO'}`,
  ]
  notes.forEach((line, i) => {
    doc.text(line, nbX + 3, nbY + 11 + i * 6)
  })

  // ---- Specs block (middle-left, below the drawing image) -----------------
  const specX = nbX + nbW + 8
  const specY = nbY
  const specW = 110
  const specH = nbH

  doc.setLineWidth(0.4)
  doc.rect(specX, specY, specW, specH)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('SPECIFICATION', specX + 2, specY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const specLines: { label: string; value: string }[] = [
    { label: 'Belt', value: drawing.belt || '—' },
    { label: 'Motor', value: drawing.motor || '—' },
    { label: 'Gearbox', value: drawing.gearbox || '—' },
    { label: 'Control', value: drawing.control || '—' },
    { label: 'VSD', value: '—' },
  ]
  const specLineH = (specH - 8) / specLines.length
  specLines.forEach((sl, i) => {
    const y = specY + 8 + (i + 0.7) * specLineH
    doc.setFont('helvetica', 'bold')
    doc.text(`${sl.label}:`, specX + 3, y)
    doc.setFont('helvetica', 'normal')
    doc.text(sl.value, specX + 22, y)
  })

  // ---- Drawing image area (upper-left, centered horizontally) ------------
  const imgAreaW = 290
  const imgAreaH = 170
  const imgAreaX = borderInset + 12
  const imgAreaY = borderInset + 12

  doc.setLineWidth(0.3)
  doc.setDrawColor(120, 120, 120)
  doc.rect(imgAreaX, imgAreaY, imgAreaW, imgAreaH)
  doc.setDrawColor(0, 0, 0)

  if (imageDataUrl) {
    // Fit-contain inside the area, preserving aspect ratio.
    const px = pngSizeFromDataUrl(imageDataUrl)
    const aspect = px && px.height > 0 ? px.width / px.height : imgAreaW / imgAreaH
    let drawW = imgAreaW
    let drawH = drawW / aspect
    if (drawH > imgAreaH) {
      drawH = imgAreaH
      drawW = drawH * aspect
    }
    const drawX = imgAreaX + (imgAreaW - drawW) / 2
    const drawY = imgAreaY + (imgAreaH - drawH) / 2
    doc.addImage(imageDataUrl, 'PNG', drawX, drawY, drawW, drawH)
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(14)
    doc.setTextColor(140, 140, 140)
    doc.text('No drawing yet', imgAreaX + imgAreaW / 2, imgAreaY + imgAreaH / 2, {
      align: 'center',
      baseline: 'middle',
    })
    doc.setTextColor(0, 0, 0)
  }

  // ---- Page 2: BOM table --------------------------------------------------
  doc.addPage()

  // Outer border again on page 2 for consistency.
  doc.setLineWidth(0.6)
  doc.rect(
    borderInset,
    borderInset,
    pageW - borderInset * 2,
    pageH - borderInset * 2,
  )

  // Page title.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('Bill of Materials', borderInset + 8, borderInset + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const subtitleParts = [
    drawing.title ? `Drawing: ${drawing.title}` : null,
    drawing.drawingNumber ? `No. ${drawing.drawingNumber}` : null,
    drawing.customer ? `Customer: ${drawing.customer}` : null,
    `Conveyor width: ${conveyorWidth} mm`,
    `Date: ${formatDateDisplay(now)}`,
  ].filter((s): s is string => Boolean(s))
  doc.text(subtitleParts.join('   |   '), borderInset + 8, borderInset + 20)
  doc.setTextColor(0, 0, 0)

  const body = bom.rows.map((r) => [
    r.label,
    String(r.qty),
    formatAud(r.unitPrice),
    formatAud(r.lineTotal),
  ])

  autoTable(doc, {
    startY: borderInset + 26,
    margin: { left: borderInset + 8, right: borderInset + 8 },
    head: [['Item', 'Qty', 'Unit Price (AUD)', 'Line Total (AUD)']],
    body,
    foot: [['', '', 'Total', formatAud(bom.total)]],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [235, 235, 235],
      textColor: [0, 0, 0],
      halign: 'left',
    },
    footStyles: {
      fontStyle: 'bold',
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 55, halign: 'right' },
      3: { cellWidth: 55, halign: 'right' },
    },
  })

  // ---- 4. Save -----------------------------------------------------------
  const baseName = drawing.drawingNumber?.trim() || 'conveyor'
  const safe = baseName.replace(/[^a-zA-Z0-9_\-]+/g, '-')
  doc.save(`${safe}-${formatDate(now)}.pdf`)
}

/** Helper: trim text until it fits within a width budget, with an ellipsis. */
function truncateToWidth(
  doc: jsPDF,
  text: string,
  maxWidth: number,
): string {
  if (doc.getTextWidth(text) <= maxWidth) return text
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    const candidate = text.slice(0, mid) + '…'
    if (doc.getTextWidth(candidate) <= maxWidth) lo = mid
    else hi = mid - 1
  }
  return text.slice(0, lo) + '…'
}
