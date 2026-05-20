import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useStore } from './store'
import { snapshotStage } from './stageHandle'
import { computeBom, formatAud, formatMm } from './bom'
import { computeChainGeometry } from './chainGeometry'
import { MODULES } from '../modules/registry'

function ymd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
function dmy(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function pngSize(dataUrl: string): { width: number; height: number } | null {
  const c = dataUrl.indexOf(',')
  if (c < 0) return null
  try {
    const bin = atob(dataUrl.slice(c + 1))
    if (bin.length < 24) return null
    const u32 = (o: number) =>
      ((bin.charCodeAt(o) << 24) |
        (bin.charCodeAt(o + 1) << 16) |
        (bin.charCodeAt(o + 2) << 8) |
        bin.charCodeAt(o + 3)) >>>
      0
    const w = u32(16)
    const h = u32(20)
    if (!w || !h) return null
    return { width: w, height: h }
  } catch {
    return null
  }
}

function truncate(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    const cand = text.slice(0, mid) + '…'
    if (doc.getTextWidth(cand) <= maxW) lo = mid
    else hi = mid - 1
  }
  return text.slice(0, lo) + '…'
}

function drawGeneratedTopView(
  doc: jsPDF,
  geo: ReturnType<typeof computeChainGeometry>,
  conveyorWidth: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  doc.setLineWidth(0.3)
  doc.setDrawColor(120, 120, 120)
  doc.rect(x, y, w, h)
  doc.setDrawColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('TOP VIEW - GENERATED', x + 2, y + 5)

  if (!geo.bounds || geo.links.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text('No conveyor placed', x + w / 2, y + h / 2, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    return
  }

  const pad = 7
  const stripY = y + h / 2 - 4
  const stripH = 8
  const minX = geo.bounds.x
  const scale = (w - pad * 2) / Math.max(1, geo.footprintLengthMm)
  const toX = (worldX: number) => x + pad + (worldX - minX) * scale

  doc.rect(x + pad, stripY, w - pad * 2, stripH)
  doc.setLineWidth(0.2)
  doc.line(x + pad, stripY + stripH / 2, x + w - pad, stripY + stripH / 2)

  for (const link of geo.links) {
    const xs = link.corners.map((corner) => corner.x)
    const x0 = toX(Math.min(...xs))
    const x1 = toX(Math.max(...xs))
    const def = MODULES[link.kind]
    if (def.role === 'angle') {
      doc.setLineDashPattern([1.5, 1], 0)
      doc.line(x0, stripY - 3, x0, stripY + stripH + 3)
      doc.line(x1, stripY - 3, x1, stripY + stripH + 3)
      doc.setLineDashPattern([], 0)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.5)
      doc.text(`${def.bendDeg ?? ''}°`, (x0 + x1) / 2, stripY - 1, {
        align: 'center',
      })
    } else if (def.role === 'feed') {
      doc.setFillColor(245, 245, 245)
      doc.rect(x0 + 0.5, stripY + 1, Math.max(1, x1 - x0 - 1), stripH - 2, 'F')
    } else if (def.role === 'drive') {
      doc.setFillColor(30, 30, 30)
      doc.rect(x1 - 2, stripY + 0.5, 2, stripH - 1, 'F')
    }
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(80, 80, 80)
  doc.text(
    `${Math.round(geo.footprintLengthMm)} mm x ${conveyorWidth} mm`,
    x + w - 2,
    y + h - 2,
    { align: 'right' },
  )
  doc.setTextColor(0, 0, 0)
}

export async function exportConveyorPdf(): Promise<void> {
  const {
    links,
    conveyorWidth,
    drawing,
    accessoryQuantities,
    priceOverrides,
    supportOverrides,
    titleBlock,
    legend,
  } = useStore.getState()
  const geo = computeChainGeometry(links, conveyorWidth)
  const bom = computeBom(links, conveyorWidth, drawing, {
    accessoryQuantities,
    priceOverrides,
    supportOverrides,
  })

  // Tight crop with extra padding to include dimension annotations
  const padded = geo.bounds
    ? {
        x: geo.bounds.x - 250,
        y: geo.bounds.y - 250,
        width: geo.bounds.width + 500,
        height: geo.bounds.height + 500,
      }
    : null
  const image = padded
    ? snapshotStage({ worldBox: padded, pixelRatio: 2, padding: 40 })
    : null

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
  const pageW = 420
  const pageH = 297
  const M = 8
  const now = new Date()
  const docTitle = drawing.title.trim() || 'Conveyor layout'
  const projectName = titleBlock.projectName.trim() || docTitle
  const customerName = drawing.customer.trim() || '—'
  const drawingNo = drawing.drawingNumber.trim() || '—'

  doc.setLineWidth(0.6)
  doc.setDrawColor(0, 0, 0)
  doc.rect(M, M, pageW - M * 2, pageH - M * 2)

  const drawPanelHeader = (x: number, y: number, w: number, title: string) => {
    doc.setFillColor(235, 235, 235)
    doc.setDrawColor(0, 0, 0)
    doc.rect(x, y, w, 7, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    doc.text(title, x + 2.5, y + 4.8)
  }

  const drawQuoteRow = (
    x: number,
    y: number,
    label: string,
    value: string,
    valueW: number,
  ) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(80, 80, 80)
    doc.text(label.toUpperCase(), x, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.text(truncate(doc, value, valueW), x + 30, y)
  }

  // ---- Quotation title and summary ----
  const imgX = M + 12
  const imgY = M + 24
  const imgW = 290
  const imgH = 158
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(0, 0, 0)
  doc.text(truncate(doc, docTitle, 230), imgX, M + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(65, 65, 65)
  doc.text(
    truncate(
      doc,
      `Quote drawing | Project: ${projectName} | Customer: ${customerName} | Drawing No: ${drawingNo} | Date: ${titleBlock.date || dmy(now)}`,
      285,
    ),
    imgX,
    M + 14,
  )
  doc.setTextColor(0, 0, 0)

  const summaryX = imgX + imgW + 10
  const summaryY = M + 12
  const summaryW = pageW - M - summaryX - 8
  const summaryH = 88
  doc.setLineWidth(0.35)
  doc.rect(summaryX, summaryY, summaryW, summaryH)
  drawPanelHeader(summaryX, summaryY, summaryW, 'QUOTATION SUMMARY')
  const summaryRows: { label: string; value: string }[] = [
    { label: 'Customer', value: customerName },
    { label: 'Drawing No.', value: drawingNo },
    { label: 'Footprint', value: formatMm(bom.footprintLengthMm) },
    { label: 'Height', value: formatMm(bom.heightMm) },
    { label: 'Belt path', value: formatMm(bom.beltLengthMm) },
    { label: 'Width', value: `${conveyorWidth} mm` },
    { label: 'Feed shield', value: drawing.feedShield === 'yes' ? 'Included' : 'Not included' },
    { label: 'BOM total', value: formatAud(bom.subtotal) },
  ]
  summaryRows.forEach((row, i) => {
    drawQuoteRow(summaryX + 4, summaryY + 15 + i * 8.5, row.label, row.value, summaryW - 36)
  })

  const legendX = summaryX
  const legendY = summaryY + summaryH + 8
  const legendW = summaryW
  const legendH = 58
  doc.setLineWidth(0.35)
  doc.rect(legendX, legendY, legendW, legendH)
  drawPanelHeader(legendX, legendY, legendW, 'DRAWING LEGEND')

  const drawLegendLine = (
    y: number,
    label: string,
    width: number,
    shade: number,
  ) => {
    doc.setDrawColor(shade, shade, shade)
    doc.setLineWidth(width)
    doc.line(legendX + 5, y, legendX + 22, y)
    doc.setDrawColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(0, 0, 0)
    doc.text(label, legendX + 26, y + 2)
  }

  drawLegendLine(legendY + 16, 'Conveyor belt path', 1.1, 0)
  drawLegendLine(legendY + 26, 'Module / frame outline', 0.45, 0)
  drawLegendLine(legendY + 36, 'Dimension annotation', 0.3, 120)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)
  doc.text(`Scale: ${titleBlock.scale || 'Fit to sheet'}`, legendX + 5, legendY + 48)
  doc.text(truncate(doc, legend.notes || 'Commercial BOM follows on page 2', legendW - 10), legendX + 5, legendY + 54)
  doc.setTextColor(0, 0, 0)

  drawGeneratedTopView(doc, geo, conveyorWidth, summaryX, legendY + legendH + 8, summaryW, 38)

  // ---- Title block (bottom-right) ----
  const tbW = 200
  const tbH = 60
  const tbX = pageW - M - tbW
  const tbY = pageH - M - tbH
  doc.setLineWidth(0.4)
  doc.rect(tbX, tbY, tbW, tbH)

  const rowH = tbH / 4
  const col0W = 90
  const col1W = 80
  const col2W = tbW - col0W - col1W
  for (let i = 1; i < 4; i++) {
    doc.line(tbX, tbY + i * rowH, tbX + col0W + col1W, tbY + i * rowH)
  }
  doc.line(tbX + col0W, tbY, tbX + col0W, tbY + tbH)
  doc.line(tbX + col0W + col1W, tbY, tbX + col0W + col1W, tbY + tbH)

  const cells: { label: string; value: string }[][] = [
    [
      { label: 'Project', value: projectName },
      { label: 'Drawing No.', value: drawing.drawingNumber || '—' },
    ],
    [
      { label: 'Customer', value: drawing.customer || '—' },
      { label: 'Revision', value: titleBlock.revision || '—' },
    ],
    [
      { label: 'Drawn by', value: titleBlock.drawnBy || 'ConveyorDeck' },
      { label: 'Belt', value: drawing.belt || '—' },
    ],
    [
      { label: 'Checked by', value: titleBlock.checkedBy || '—' },
      { label: 'Date', value: titleBlock.date || dmy(now) },
    ],
  ]

  const drawCell = (
    x: number,
    y: number,
    w: number,
    h: number,
    c: { label: string; value: string },
  ) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(90, 90, 90)
    doc.text(c.label.toUpperCase(), x + 2, y + 3.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(truncate(doc, c.value, w - 4), x + 2, y + h - 3.5)
  }

  cells.forEach((row, i) => {
    drawCell(tbX, tbY + i * rowH, col0W, rowH, row[0]!)
    drawCell(tbX + col0W, tbY + i * rowH, col1W, rowH, row[1]!)
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(0, 0, 0)
  doc.text(
    titleBlock.logoText || titleBlock.company || 'ConveyorDeck',
    tbX + col0W + col1W + col2W / 2,
    tbY + tbH / 2 - 2,
    { align: 'center' },
  )
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
  doc.setTextColor(0, 0, 0)

  // ---- Notes (bottom-left) ----
  const nbW = 90
  const nbH = 32
  const nbX = M + 4
  const nbY = pageH - M - nbH - 2
  doc.setLineWidth(0.4)
  doc.rect(nbX, nbY, nbW, nbH)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('NOTES', nbX + 2, nbY + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const notes = [
    `1- Belt path: ${Math.round(bom.beltLengthMm)} mm`,
    `2- Overall height: ${Math.round(bom.heightMm)} mm`,
    `3- Feed Shield  ${drawing.feedShield === 'yes' ? 'YES' : 'NO'}`,
  ]
  notes.forEach((line, i) => doc.text(line, nbX + 3, nbY + 11 + i * 6))

  // ---- Specs ----
  const sX = nbX + nbW + 8
  const sY = nbY
  const sW = 110
  doc.rect(sX, sY, sW, nbH)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('SPECIFICATION', sX + 2, sY + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const specs: { l: string; v: string }[] = [
    { l: 'Belt', v: drawing.belt || '—' },
    { l: 'Motor', v: drawing.motor || '—' },
    { l: 'Gearbox', v: drawing.gearbox || '—' },
    { l: 'Control', v: drawing.control || '—' },
  ]
  const lineH = (nbH - 8) / specs.length
  specs.forEach((s, i) => {
    const y = sY + 8 + (i + 0.7) * lineH
    doc.setFont('helvetica', 'bold')
    doc.text(`${s.l}:`, sX + 3, y)
    doc.setFont('helvetica', 'normal')
    doc.text(s.v, sX + 22, y)
  })

  // ---- Drawing image area ----
  doc.setLineWidth(0.3)
  doc.setDrawColor(120, 120, 120)
  doc.rect(imgX, imgY, imgW, imgH)
  doc.setDrawColor(0, 0, 0)
  if (image) {
    const px = pngSize(image)
    const ar = px && px.height > 0 ? px.width / px.height : imgW / imgH
    let w = imgW
    let h = w / ar
    if (h > imgH) {
      h = imgH
      w = h * ar
    }
    doc.addImage(image, 'PNG', imgX + (imgW - w) / 2, imgY + (imgH - h) / 2, w, h)
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(14)
    doc.setTextColor(140, 140, 140)
    doc.text('No conveyor placed', imgX + imgW / 2, imgY + imgH / 2, {
      align: 'center',
      baseline: 'middle',
    })
    doc.setTextColor(0, 0, 0)
  }

  // Header strip with key dimensions printed in a row above the drawing
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(
    truncate(
      doc,
      `Footprint: ${formatMm(bom.footprintLengthMm)}    Height: ${formatMm(bom.heightMm)}    Belt: ${formatMm(bom.beltLengthMm)}    Width: ${conveyorWidth} mm`,
      285,
    ),
    imgX,
    M + 20,
  )

  // ---- Page 2: BOM ----
  doc.addPage()
  doc.setLineWidth(0.6)
  doc.rect(M, M, pageW - M * 2, pageH - M * 2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('Bill of Materials', M + 8, M + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const subtitle = [
    drawing.title ? `Drawing: ${drawing.title}` : null,
    drawing.drawingNumber ? `No. ${drawing.drawingNumber}` : null,
    drawing.customer ? `Customer: ${drawing.customer}` : null,
    `Width: ${conveyorWidth} mm`,
    `Date: ${dmy(now)}`,
  ]
    .filter((s): s is string => Boolean(s))
    .join('   |   ')
  doc.text(subtitle, M + 8, M + 20)
  doc.setTextColor(0, 0, 0)

  const body = bom.rows.map((r) => [
    r.label + (r.detail ? `\n${r.detail}` : ''),
    `${r.qty} ${r.unit}`,
    formatAud(r.unitPrice),
    formatAud(r.lineTotal),
  ])

  autoTable(doc, {
    startY: M + 28,
    margin: { left: M + 8, right: M + 8 },
    head: [['Item', 'Qty', 'Unit Price (AUD)', 'Line Total (AUD)']],
    body,
    foot: [['', '', 'SUBTOTAL', formatAud(bom.subtotal)]],
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

  const baseName = drawing.drawingNumber?.trim() || 'conveyor'
  const safe = baseName.replace(/[^a-zA-Z0-9_-]+/g, '-')
  doc.save(`${safe}-${ymd(now)}.pdf`)
}
