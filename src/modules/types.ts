export type ModuleKind =
  | 'feed'
  | 'feed-low-profile'
  | 'straight-300'
  | 'straight-short'
  | 'straight-900'
  | 'straight-1200'
  | 'straight-long'
  | 'straight-2400'
  | 'straight-connector'
  | 'angle-30'
  | 'angle-45'
  | 'doubling-link'
  | 'drive'
  | 'drive-compact'
  | 'retainer-extension'
  | 'retainer-connector'
  | 'retainer-30-inner'
  | 'retainer-30-outer'
  | 'retainer-45-inner'
  | 'retainer-45-outer'
  | 'leg-40x40'
  | 'leg-40x80'
  | 'black-plastic-wheel'
  | 'castor'
  | 'castor-brake'
  | 'top-enclosure'
  | 'bottom-enclosure'
  | 'variable-speed-control'
  | 'emergency-stop'

export type LinkVariant = 'horizontal' | 'incline-up' | 'incline-down'

export type VisualStyle =
  | 'feed'
  | 'plain'
  | 'angle-30'
  | 'angle-45'
  | 'drive'
  | 'connector'
  | 'retainer'
  | 'support'
  | 'wheel'
  | 'enclosure'
  | 'control'

export type PaletteGroup = 'belt' | 'retainer' | 'support' | 'enclosure' | 'control'

export type ModuleRole = 'feed' | 'middle' | 'angle' | 'drive' | 'accessory'

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
  role: ModuleRole

  /**
   * True for modules that participate in the snapped conveyor chain.
   * Accessory/catalog items are still priced/configurable, but need their own
   * placement workflow before they can be dropped into the side elevation.
   */
  chainPlaceable?: boolean

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
