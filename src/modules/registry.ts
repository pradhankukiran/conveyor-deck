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

export const MODULES: Record<ModuleKind, ModuleDef> = {
  feed: FEED,
  'straight-short': STRAIGHT_SHORT,
  'straight-long': STRAIGHT_LONG,
  'angle-30': ANGLE_30,
  'angle-45': ANGLE_45,
  drive: DRIVE,
}

export const MODULE_ORDER: ModuleKind[] = [
  'feed',
  'straight-short',
  'straight-long',
  'angle-30',
  'angle-45',
  'drive',
]

export function getModule(kind: ModuleKind): ModuleDef {
  return MODULES[kind]
}

export function modulePrice(kind: ModuleKind, conveyorWidthMm: number): number {
  const def = MODULES[kind]
  const widthAdder = def.pricePerMmWidth * Math.max(0, conveyorWidthMm - 100)
  return def.basePrice + widthAdder
}
