export type ModuleKind =
  | 'feed'
  | 'straight-short'
  | 'straight-long'
  | 'angle-30'
  | 'angle-45'
  | 'drive'

export type LinkVariant = 'horizontal' | 'incline-up' | 'incline-down'

export type VisualStyle =
  | 'feed'
  | 'plain'
  | 'angle-30'
  | 'angle-45'
  | 'drive'

export type PaletteGroup = 'belt' | 'support' | 'control'

export type ModuleDef = {
  kind: ModuleKind
  label: string
  shortLabel: string
  description: string
  group: PaletteGroup

  /** Length along belt direction (mm). */
  length: number
  /** True if this module is a belt segment with its width tied to the conveyor width. */
  matchesConveyorWidth: boolean

  /** For angle modules: the bend in degrees (always positive; variant decides sign). */
  bendDeg?: number

  /** Visual style key used by the renderer. */
  visual: VisualStyle

  /** Role in the chain — drives connection rules. */
  role: 'feed' | 'middle' | 'angle' | 'drive'

  /** Base unit price (AUD). */
  basePrice: number
  /** Optional cost adder per mm of conveyor width above 100mm baseline. */
  pricePerMmWidth: number
}

/** A single link in the chain. Position is derived from order via chain walk. */
export type Link = {
  id: string
  kind: ModuleKind
  variant: LinkVariant
}
