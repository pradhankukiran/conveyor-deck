import type { ModuleDef, ModuleKind } from './types'

const FEED: ModuleDef = {
  kind: 'feed',
  label: 'Feed Section',
  shortLabel: 'Feed',
  description: 'Loading hopper inlet',
  group: 'belt',
  length: 500,
  matchesConveyorWidth: true,
  visual: 'feed',
  role: 'feed',
  basePrice: 480,
  pricePerMmWidth: 1.6,
}

const FEED_LOW_PROFILE: ModuleDef = {
  kind: 'feed-low-profile',
  label: 'Low-Profile Feed Section',
  shortLabel: 'Low Feed',
  description: 'Compact inlet section',
  group: 'belt',
  length: 450,
  matchesConveyorWidth: true,
  visual: 'feed',
  role: 'feed',
  basePrice: 520,
  pricePerMmWidth: 1.4,
}

const STRAIGHT_300: ModuleDef = {
  kind: 'straight-300',
  label: 'Straight Extension 300',
  shortLabel: 'Straight 300',
  description: 'Short belt extension',
  group: 'belt',
  length: 300,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 160,
  pricePerMmWidth: 0.7,
}

const STRAIGHT_SHORT: ModuleDef = {
  kind: 'straight-short',
  label: 'Straight Extension 600',
  shortLabel: 'Straight 600',
  description: 'Belt extension',
  group: 'belt',
  length: 600,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 240,
  pricePerMmWidth: 0.9,
}

const STRAIGHT_900: ModuleDef = {
  kind: 'straight-900',
  label: 'Straight Extension 900',
  shortLabel: 'Straight 900',
  description: 'Belt extension',
  group: 'belt',
  length: 900,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 360,
  pricePerMmWidth: 1.0,
}

const STRAIGHT_1200: ModuleDef = {
  kind: 'straight-1200',
  label: 'Straight Extension 1200',
  shortLabel: 'Straight 1200',
  description: 'Belt extension',
  group: 'belt',
  length: 1200,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 480,
  pricePerMmWidth: 1.2,
}

const STRAIGHT_LONG: ModuleDef = {
  kind: 'straight-long',
  label: 'Straight Extension 1700',
  shortLabel: 'Straight 1700',
  description: 'Long belt extension',
  group: 'belt',
  length: 1700,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 640,
  pricePerMmWidth: 1.4,
}

const STRAIGHT_2400: ModuleDef = {
  kind: 'straight-2400',
  label: 'Straight Extension 2400',
  shortLabel: 'Straight 2400',
  description: 'Extra-long belt extension',
  group: 'belt',
  length: 2400,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 920,
  pricePerMmWidth: 1.8,
}

const ANGLE_30: ModuleDef = {
  kind: 'angle-30',
  label: '30° Angle Module',
  shortLabel: '30° Angle',
  description: 'Bend section',
  group: 'belt',
  length: 400,
  matchesConveyorWidth: true,
  bendDeg: 30,
  visual: 'angle-30',
  role: 'angle',
  basePrice: 720,
  pricePerMmWidth: 1.8,
}

const ANGLE_45: ModuleDef = {
  kind: 'angle-45',
  label: '45° Angle Module',
  shortLabel: '45° Angle',
  description: 'Steep bend section',
  group: 'belt',
  length: 400,
  matchesConveyorWidth: true,
  bendDeg: 45,
  visual: 'angle-45',
  role: 'angle',
  basePrice: 780,
  pricePerMmWidth: 1.8,
}

const DRIVE: ModuleDef = {
  kind: 'drive',
  label: 'Drive Head',
  shortLabel: 'Drive',
  description: 'Motor + gearbox',
  group: 'belt',
  length: 320,
  matchesConveyorWidth: true,
  visual: 'drive',
  role: 'drive',
  basePrice: 1850,
  pricePerMmWidth: 0.6,
}

const DRIVE_COMPACT: ModuleDef = {
  kind: 'drive-compact',
  label: 'Compact Drive Head',
  shortLabel: 'Compact Drive',
  description: 'Compact motor + gearbox',
  group: 'belt',
  length: 280,
  matchesConveyorWidth: true,
  visual: 'drive',
  role: 'drive',
  basePrice: 1620,
  pricePerMmWidth: 0.5,
}

export const MODULES: Record<ModuleKind, ModuleDef> = {
  feed: FEED,
  'feed-low-profile': FEED_LOW_PROFILE,
  'straight-300': STRAIGHT_300,
  'straight-short': STRAIGHT_SHORT,
  'straight-900': STRAIGHT_900,
  'straight-1200': STRAIGHT_1200,
  'straight-long': STRAIGHT_LONG,
  'straight-2400': STRAIGHT_2400,
  'angle-30': ANGLE_30,
  'angle-45': ANGLE_45,
  drive: DRIVE,
  'drive-compact': DRIVE_COMPACT,
}

export const MODULE_ORDER: ModuleKind[] = [
  'feed',
  'feed-low-profile',
  'straight-300',
  'straight-short',
  'straight-900',
  'straight-1200',
  'straight-long',
  'straight-2400',
  'angle-30',
  'angle-45',
  'drive',
  'drive-compact',
]

export function getModule(kind: ModuleKind): ModuleDef {
  return MODULES[kind]
}

export function modulePrice(kind: ModuleKind, conveyorWidthMm: number): number {
  const def = MODULES[kind]
  const widthAdder = def.pricePerMmWidth * Math.max(0, conveyorWidthMm - 100)
  return def.basePrice + widthAdder
}
