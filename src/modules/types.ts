export type ModuleKind =
  | 'feed'
  | 'straight-short'
  | 'straight-long'
  | 'angle-30'
  | 'angle-45'
  | 'drive'
  | 'leg-40'
  | 'leg-80'
  | 'castor'
  | 'castor-brake'

export type PortFacing = 'east' | 'west' | 'north' | 'south'

export type PortKind = 'belt' | 'support'

export type Port = {
  id: string
  kind: PortKind
  facing: PortFacing
  /** local mm coords relative to module origin (top-left of bounding box, looking top-down) */
  x: number
  y: number
}

export type VisualStyle =
  | 'plain'
  | 'feed'
  | 'drive'
  | 'angle-30'
  | 'angle-45'
  | 'leg'
  | 'castor'
  | 'castor-brake'

export type PaletteGroup = 'belt' | 'support' | 'control'

export type ModuleDef = {
  kind: ModuleKind
  label: string
  shortLabel: string
  description: string
  group: PaletteGroup

  /** Length along belt direction (mm). For non-belt parts this is the footprint length. */
  length: number
  /** If true, the visual width tracks the global conveyor width. */
  matchesConveyorWidth: boolean
  /** Used only when matchesConveyorWidth is false. */
  fixedWidth?: number

  /** Generate connection ports given the current conveyor width. */
  ports: (conveyorWidthMm: number) => Port[]

  /** Renderer hint — concrete shape is drawn by the canvas. */
  visual: VisualStyle

  /** Base unit price (AUD). */
  basePrice: number
  /** Linear cost adder per mm of conveyor width above the 100mm baseline. */
  pricePerMmWidth: number
}

/** A single instance placed on the canvas. */
export type ModuleInstance = {
  id: string
  kind: ModuleKind
  /** World-space position of the module origin (mm). */
  x: number
  y: number
  /** Rotation in degrees (top-view), 0 = belt runs east. */
  rotation: number
}
