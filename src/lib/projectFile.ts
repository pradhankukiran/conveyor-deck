import { MODULES } from '../modules/registry'
import type { Link, LinkVariant } from '../modules/types'
import type { DrawingMeta } from './store'

const PROJECT_APP = 'conveyor-deck'
const PROJECT_VERSION = 1
const DEFAULT_CONVEYOR_WIDTH = 600

const OPTIONAL_STATE_KEY =
  /^(accessory|accessories|template|templates|admin|priceOverrides|supportOverrides|titleBlock|legend)/i

const defaultDrawing: DrawingMeta = {
  title: '',
  customer: '',
  drawingNumber: '',
  belt: '',
  motor: '',
  gearbox: '',
  control: '',
  feedShield: 'no',
}

export type ProjectState = {
  conveyorWidth: number
  links: Link[]
  drawing: DrawingMeta
} & Record<string, unknown>

export type ProjectFile = {
  app: typeof PROJECT_APP
  version: typeof PROJECT_VERSION
  savedAt: string
  state: ProjectState
}

type StoreSnapshot = {
  conveyorWidth?: unknown
  links?: unknown
  drawing?: unknown
} & Record<string, unknown>

const linkVariants: LinkVariant[] = ['horizontal', 'incline-up', 'incline-down']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeDrawing(value: unknown): DrawingMeta {
  const drawing: Record<string, unknown> = { ...defaultDrawing }

  if (isRecord(value)) {
    Object.assign(drawing, value)
  }

  drawing.title = stringField(drawing.title)
  drawing.customer = stringField(drawing.customer)
  drawing.drawingNumber = stringField(drawing.drawingNumber)
  drawing.belt = stringField(drawing.belt)
  drawing.motor = stringField(drawing.motor)
  drawing.gearbox = stringField(drawing.gearbox)
  drawing.control = stringField(drawing.control)
  drawing.feedShield = drawing.feedShield === 'yes' ? 'yes' : 'no'

  return drawing as DrawingMeta
}

function normalizeConveyorWidth(value: unknown): number {
  const width = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(width) && width > 0 ? width : DEFAULT_CONVEYOR_WIDTH
}

function normalizeLinks(value: unknown): Link[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return []
    if (typeof item.kind !== 'string' || !(item.kind in MODULES)) return []

    const id =
      typeof item.id === 'string' && item.id.trim() ? item.id : `L${index + 1}`
    const variant = linkVariants.includes(item.variant as LinkVariant)
      ? (item.variant as LinkVariant)
      : 'horizontal'

    return [{ id, kind: item.kind, variant } as Link]
  })
}

function optionalProjectState(source: StoreSnapshot): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source).filter(([key, value]) => {
      return OPTIONAL_STATE_KEY.test(key) && typeof value !== 'function'
    }),
  )
}

function normalizeProjectState(source: unknown): ProjectState {
  const state = isRecord(source) ? source : {}

  return {
    ...optionalProjectState(state),
    conveyorWidth: normalizeConveyorWidth(state.conveyorWidth),
    links: normalizeLinks(state.links),
    drawing: normalizeDrawing(state.drawing),
  }
}

function projectBaseName(drawing: DrawingMeta): string {
  const name = drawing.drawingNumber.trim() || drawing.title.trim() || 'conveyor'
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function createProjectFile(state: StoreSnapshot): ProjectFile {
  return {
    app: PROJECT_APP,
    version: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    state: normalizeProjectState(state),
  }
}

export function parseProjectFile(text: string): ProjectFile {
  const parsed: unknown = JSON.parse(text)
  const source =
    isRecord(parsed) && isRecord(parsed.state) ? parsed.state : parsed

  return {
    app: PROJECT_APP,
    version: PROJECT_VERSION,
    savedAt:
      isRecord(parsed) && typeof parsed.savedAt === 'string'
        ? parsed.savedAt
        : new Date().toISOString(),
    state: normalizeProjectState(source),
  }
}

export async function readProjectFile(file: File): Promise<ProjectFile> {
  return parseProjectFile(await file.text())
}

export function downloadProjectFile(project: ProjectFile) {
  const blob = new Blob([`${JSON.stringify(project, null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${projectBaseName(project.state.drawing)}.conveyor.json`
  link.click()
  URL.revokeObjectURL(url)
}
