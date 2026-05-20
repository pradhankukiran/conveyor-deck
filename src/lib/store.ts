import { create } from 'zustand'
import type { Link, LinkVariant, ModuleKind } from '../modules/types'
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

type StoreState = {
  conveyorWidth: number
  links: Link[]
  selectedLinkId: string | null
  drawing: DrawingMeta
  view: ViewState
  viewResetToken: number

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

  setView: (v: Partial<ViewState>) => void
  requestViewReset: () => void
  clear: () => void
  replaceState: (s: Partial<Pick<StoreState, 'links' | 'drawing' | 'conveyorWidth'>>) => void
}

let idCounter = 0
const nextId = () => `L${++idCounter}`

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
  focus?: 'feed' | 'middle' | 'angle' | 'drive',
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

export const useStore = create<StoreState>((set, get) => ({
  conveyorWidth: 600,
  links: [],
  selectedLinkId: null,
  drawing: initialDrawing,
  view: { x: 0, y: 0, scale: 1 },
  viewResetToken: 0,

  setConveyorWidth: (mm) => set({ conveyorWidth: mm }),

  addLink: (kind) => {
    const links = get().links
    const result = canInsertAt(links, kind, links.length)
    if (!result.ok) return null
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
    if (!result.ok) return null
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

  moveLink: (id, toIndex) =>
    set((s) => {
      const from = s.links.findIndex((l) => l.id === id)
      if (from === -1) return s
      const next = [...s.links]
      const [link] = next.splice(from, 1)
      if (!link) return s
      const clamped = Math.max(0, Math.min(toIndex, next.length))
      next.splice(clamped, 0, link)
      const validation = validateChain(next)
      if (!validation.ok) return s
      return { links: next }
    }),

  setLinkVariant: (id, variant) =>
    set((s) => ({
      links: s.links.map((l) => (l.id === id ? { ...l, variant } : l)),
    })),

  selectLink: (id) => set({ selectedLinkId: id }),

  setDrawingField: (key, value) =>
    set((s) => ({ drawing: { ...s.drawing, [key]: value } })),

  setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
  requestViewReset: () =>
    set((s) => ({ viewResetToken: s.viewResetToken + 1 })),

  clear: () => set({ links: [], selectedLinkId: null }),

  replaceState: (s) =>
    set((prev) => ({
      ...prev,
      ...(s.links !== undefined ? { links: s.links } : {}),
      ...(s.drawing !== undefined ? { drawing: s.drawing } : {}),
      ...(s.conveyorWidth !== undefined
        ? { conveyorWidth: s.conveyorWidth }
        : {}),
    })),
}))

export const MODULE_DRAG_TYPE = 'application/x-conveyor-module'
