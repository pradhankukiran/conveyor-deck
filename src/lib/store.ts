import { create } from 'zustand'
import type { ModuleInstance, ModuleKind } from '../modules/types'

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
  modules: ModuleInstance[]
  selectedModuleId: string | null
  drawing: DrawingMeta
  view: ViewState
  /** Bumped whenever something else wants to reset the camera. */
  viewResetToken: number

  setConveyorWidth: (mm: number) => void
  addModule: (kind: ModuleKind, x: number, y: number, rotation?: number) => string
  removeModule: (id: string) => void
  removeSelected: () => void
  updateModulePosition: (id: string, x: number, y: number) => void
  rotateModule: (id: string, deltaDeg: number) => void
  selectModule: (id: string | null) => void
  setDrawingField: <K extends keyof DrawingMeta>(
    key: K,
    value: DrawingMeta[K],
  ) => void
  setView: (v: Partial<ViewState>) => void
  requestViewReset: () => void
  clear: () => void
}

let idCounter = 0
const nextId = () => `m${++idCounter}`

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

export const useStore = create<StoreState>((set) => ({
  conveyorWidth: 600,
  modules: [],
  selectedModuleId: null,
  drawing: initialDrawing,
  view: { x: 0, y: 0, scale: 1 },
  viewResetToken: 0,

  setConveyorWidth: (mm) => set({ conveyorWidth: mm }),

  addModule: (kind, x, y, rotation = 0) => {
    const id = nextId()
    const inst: ModuleInstance = { id, kind, x, y, rotation }
    set((s) => ({ modules: [...s.modules, inst], selectedModuleId: id }))
    return id
  },

  removeModule: (id) =>
    set((s) => ({
      modules: s.modules.filter((m) => m.id !== id),
      selectedModuleId:
        s.selectedModuleId === id ? null : s.selectedModuleId,
    })),

  removeSelected: () =>
    set((s) => {
      if (!s.selectedModuleId) return s
      return {
        modules: s.modules.filter((m) => m.id !== s.selectedModuleId),
        selectedModuleId: null,
      }
    }),

  updateModulePosition: (id, x, y) =>
    set((s) => ({
      modules: s.modules.map((m) => (m.id === id ? { ...m, x, y } : m)),
    })),

  rotateModule: (id, deltaDeg) =>
    set((s) => ({
      modules: s.modules.map((m) =>
        m.id === id
          ? { ...m, rotation: (m.rotation + deltaDeg) % 360 }
          : m,
      ),
    })),

  selectModule: (id) => set({ selectedModuleId: id }),

  setDrawingField: (key, value) =>
    set((s) => ({ drawing: { ...s.drawing, [key]: value } })),

  setView: (v) =>
    set((s) => ({ view: { ...s.view, ...v } })),

  requestViewReset: () =>
    set((s) => ({ viewResetToken: s.viewResetToken + 1 })),

  clear: () => set({ modules: [], selectedModuleId: null }),
}))

export const MODULE_DRAG_TYPE = 'application/x-conveyor-module'
