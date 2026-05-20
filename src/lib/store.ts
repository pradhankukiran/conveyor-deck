import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Link, LinkVariant, ModuleKind, ModuleRole } from '../modules/types'
import { MODULES } from '../modules/registry'

export type DrawingMeta = {
  title: string
  customer: string
  drawingNumber: string
  belt: string
  motor: string
  gearbox: string
  control: string
  feedShield: 'yes' | 'no'
}

export type ViewState = {
  x: number
  y: number
  scale: number
}

export type AccessoryQuantities = Partial<Record<ModuleKind, number>>

export type PriceOverrides = Partial<Record<ModuleKind, number>>

export type SupportOverrides = {
  legPairs: number | null
}

export type TitleBlockTemplate = {
  company: string
  projectName: string
  revision: string
  date: string
  scale: string
  pageNumber: string
  drawnBy: string
  checkedBy: string
  logoText: string
}

export type LegendTemplate = {
  notes: string
}

type StoreState = {
  conveyorWidth: number
  links: Link[]
  selectedLinkId: string | null
  drawing: DrawingMeta
  accessoryQuantities: AccessoryQuantities
  priceOverrides: PriceOverrides
  supportOverrides: SupportOverrides
  titleBlock: TitleBlockTemplate
  legend: LegendTemplate
  view: ViewState
  viewResetToken: number
  toast: { message: string; id: number } | null

  setConveyorWidth: (mm: number) => void

  /** Add a link at the end of the chain. Returns the new link id, or null if not permitted. */
  addLink: (kind: ModuleKind) => string | null
  /** Insert a link at a specific index, validated against the chain. */
  insertLink: (kind: ModuleKind, index: number) => string | null
  removeLink: (id: string) => void
  removeSelected: () => void
  moveLink: (id: string, toIndex: number) => void
  setLinkVariant: (id: string, variant: LinkVariant) => void

  selectLink: (id: string | null) => void

  setDrawingField: <K extends keyof DrawingMeta>(
    key: K,
    value: DrawingMeta[K],
  ) => void
  setAccessoryQuantity: (kind: ModuleKind, qty: number) => void
  setPriceOverride: (kind: ModuleKind, value: number | null) => void
  setSupportLegPairs: (value: number | null) => void
  setTitleBlockField: <K extends keyof TitleBlockTemplate>(
    key: K,
    value: TitleBlockTemplate[K],
  ) => void
  setLegendField: <K extends keyof LegendTemplate>(
    key: K,
    value: LegendTemplate[K],
  ) => void

  setView: (v: Partial<ViewState>) => void
  requestViewReset: () => void
  pushToast: (message: string) => void
  dismissToast: () => void
  clear: () => void
  replaceState: (s: Partial<Pick<StoreState, 'links' | 'drawing' | 'conveyorWidth' | 'accessoryQuantities' | 'priceOverrides' | 'supportOverrides' | 'titleBlock' | 'legend'>>) => void
}

let idCounter = 0
const nextId = () => `L${++idCounter}`
function bumpIdCounterFor(links: Link[]) {
  for (const l of links) {
    const m = /^L(\d+)$/.exec(l.id)
    if (m) {
      const n = Number(m[1])
      if (n > idCounter) idCounter = n
    }
  }
}

const initialDrawing: DrawingMeta = {
  title: '',
  customer: '',
  drawingNumber: '',
  belt: '',
  motor: '',
  gearbox: '',
  control: '',
  feedShield: 'no',
}

const initialTitleBlock: TitleBlockTemplate = {
  company: '',
  projectName: '',
  revision: 'A',
  date: '',
  scale: 'Fit to sheet',
  pageNumber: '1',
  drawnBy: '',
  checkedBy: '',
  logoText: 'Company Logo',
}

const initialLegend: LegendTemplate = {
  notes: 'Conveyor belt path; Module/frame outline; Dimension annotation; Auto support locations',
}

/**
 * Connection rules — a link is allowed at a given insertion index iff:
 *  - feed: must be at index 0, and only if there is no existing feed (or the slot is index 0 of empty chain)
 *  - drive: must be at the last index, and only if there's no existing drive
 *  - angle: must not be index 0 or last
 *  - middle (straight): anywhere except where it would push a drive away from end
 *
 * For inserting at index `i`, we treat the resulting chain as if the new link
 * was spliced into position i. Then validate the whole chain.
 */
export function canInsertAt(
  links: Link[],
  kind: ModuleKind,
  index: number,
): { ok: boolean; reason?: string } {
  const def = MODULES[kind]
  if (index < 0 || index > links.length) {
    return { ok: false, reason: 'Invalid position' }
  }
  if (def.chainPlaceable === false || def.role === 'accessory') {
    return { ok: false, reason: 'Configured from the properties panel' }
  }
  // Build hypothetical chain
  const hypothetical: Link[] = [
    ...links.slice(0, index),
    { id: '__test__', kind, variant: 'horizontal' },
    ...links.slice(index),
  ]
  return validateChain(hypothetical, def.role)
}

export function validateChain(
  links: Link[],
  focus?: ModuleRole,
): { ok: boolean; reason?: string } {
  if (links.length === 0) return { ok: true }

  const feedCount = links.filter((l) => MODULES[l.kind].role === 'feed').length
  const driveCount = links.filter((l) => MODULES[l.kind].role === 'drive').length

  // Drive rules
  if (driveCount > 1) {
    return { ok: false, reason: 'Only one drive head allowed' }
  }
  if (driveCount === 1 && MODULES[links[links.length - 1]!.kind].role !== 'drive') {
    return { ok: false, reason: 'Drive must be the last link' }
  }

  // Feed rules
  if (feedCount > 1) {
    return { ok: false, reason: 'Only one feed section allowed' }
  }
  if (feedCount === 1 && MODULES[links[0]!.kind].role !== 'feed') {
    return { ok: false, reason: 'Feed must be the first link' }
  }

  // Angle rules: never at the boundary
  for (let i = 0; i < links.length; i++) {
    if (MODULES[links[i]!.kind].role === 'angle') {
      if (i === 0) return { ok: false, reason: 'Angle cannot be the first link' }
      if (i === links.length - 1)
        return { ok: false, reason: 'Angle cannot be the last link' }
    }
  }

  // Focus role hints (used when checking a fresh insertion)
  void focus
  return { ok: true }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
  conveyorWidth: 600,
  links: [],
  selectedLinkId: null,
  drawing: initialDrawing,
  accessoryQuantities: {},
  priceOverrides: {},
  supportOverrides: { legPairs: null },
  titleBlock: initialTitleBlock,
  legend: initialLegend,
  view: { x: 0, y: 0, scale: 1 },
  viewResetToken: 0,
  toast: null,

  setConveyorWidth: (mm) => set({ conveyorWidth: mm }),

  addLink: (kind) => {
    const links = get().links
    const result = canInsertAt(links, kind, links.length)
    if (!result.ok) {
      get().pushToast(result.reason ?? 'Cannot add this link here')
      return null
    }
    const def = MODULES[kind]
    const variant: LinkVariant =
      def.role === 'angle' ? 'incline-up' : 'horizontal'
    const id = nextId()
    set((s) => ({
      links: [...s.links, { id, kind, variant }],
      selectedLinkId: id,
    }))
    return id
  },

  insertLink: (kind, index) => {
    const links = get().links
    const result = canInsertAt(links, kind, index)
    if (!result.ok) {
      get().pushToast(result.reason ?? 'Cannot insert here')
      return null
    }
    const def = MODULES[kind]
    const variant: LinkVariant =
      def.role === 'angle' ? 'incline-up' : 'horizontal'
    const id = nextId()
    set((s) => ({
      links: [...s.links.slice(0, index), { id, kind, variant }, ...s.links.slice(index)],
      selectedLinkId: id,
    }))
    return id
  },

  removeLink: (id) =>
    set((s) => ({
      links: s.links.filter((l) => l.id !== id),
      selectedLinkId: s.selectedLinkId === id ? null : s.selectedLinkId,
    })),

  removeSelected: () =>
    set((s) => {
      if (!s.selectedLinkId) return s
      return {
        links: s.links.filter((l) => l.id !== s.selectedLinkId),
        selectedLinkId: null,
      }
    }),

  moveLink: (id, toIndex) => {
    const current = get()
    const from = current.links.findIndex((l) => l.id === id)
    if (from === -1) return
    const next = [...current.links]
    const [link] = next.splice(from, 1)
    if (!link) return
    const clamped = Math.max(0, Math.min(toIndex, next.length))
    next.splice(clamped, 0, link)
    const validation = validateChain(next)
    if (!validation.ok) {
      current.pushToast(validation.reason ?? 'Invalid chain order')
      return
    }
    set({ links: next })
  },

  setLinkVariant: (id, variant) =>
    set((s) => ({
      links: s.links.map((l) => (l.id === id ? { ...l, variant } : l)),
    })),

  selectLink: (id) => set({ selectedLinkId: id }),

  setDrawingField: (key, value) =>
    set((s) => ({ drawing: { ...s.drawing, [key]: value } })),

  setAccessoryQuantity: (kind, qty) =>
    set((s) => {
      const next = { ...s.accessoryQuantities }
      const clean = Math.max(0, Math.floor(Number.isFinite(qty) ? qty : 0))
      if (clean === 0) delete next[kind]
      else next[kind] = clean
      return { accessoryQuantities: next }
    }),

  setPriceOverride: (kind, value) =>
    set((s) => {
      const next = { ...s.priceOverrides }
      if (value === null || !Number.isFinite(value) || value < 0) delete next[kind]
      else next[kind] = value
      return { priceOverrides: next }
    }),

  setSupportLegPairs: (value) =>
    set({
      supportOverrides: {
        legPairs:
          value === null || !Number.isFinite(value)
            ? null
            : Math.max(0, Math.floor(value)),
      },
    }),

  setTitleBlockField: (key, value) =>
    set((s) => ({ titleBlock: { ...s.titleBlock, [key]: value } })),

  setLegendField: (key, value) =>
    set((s) => ({ legend: { ...s.legend, [key]: value } })),

  setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
  requestViewReset: () =>
    set((s) => ({ viewResetToken: s.viewResetToken + 1 })),

  pushToast: (message) =>
    set({ toast: { message, id: Date.now() + Math.random() } }),
  dismissToast: () => set({ toast: null }),

  clear: () => set({ links: [], selectedLinkId: null }),

  replaceState: (s) =>
    set((prev) => ({
      ...prev,
      ...(s.links !== undefined ? { links: s.links } : {}),
      ...(s.drawing !== undefined ? { drawing: s.drawing } : {}),
      ...(s.conveyorWidth !== undefined
        ? { conveyorWidth: s.conveyorWidth }
        : {}),
      ...(s.accessoryQuantities !== undefined
        ? { accessoryQuantities: s.accessoryQuantities }
        : {}),
      ...(s.priceOverrides !== undefined ? { priceOverrides: s.priceOverrides } : {}),
      ...(s.supportOverrides !== undefined
        ? { supportOverrides: s.supportOverrides }
        : {}),
      ...(s.titleBlock !== undefined ? { titleBlock: s.titleBlock } : {}),
      ...(s.legend !== undefined ? { legend: s.legend } : {}),
    })),
    }),
    {
      name: 'conveyordeck.v2',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        conveyorWidth: s.conveyorWidth,
        links: s.links,
        drawing: s.drawing,
        accessoryQuantities: s.accessoryQuantities,
        priceOverrides: s.priceOverrides,
        supportOverrides: s.supportOverrides,
        titleBlock: s.titleBlock,
        legend: s.legend,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.links) bumpIdCounterFor(state.links)
      },
    },
  ),
)

export const MODULE_DRAG_TYPE = 'application/x-conveyor-module'
