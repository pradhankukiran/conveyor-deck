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

const STRAIGHT_CONNECTOR: ModuleDef = {
  kind: 'straight-connector',
  label: 'Straight Connector',
  shortLabel: 'Connector',
  description: 'Short transfer connector',
  group: 'belt',
  length: 180,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 120,
  pricePerMmWidth: 0.35,
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

const DOUBLING_LINK: ModuleDef = {
  kind: 'doubling-link',
  label: 'Doubling Link',
  shortLabel: 'Double Link',
  description: 'Chain transition link',
  group: 'belt',
  length: 220,
  matchesConveyorWidth: true,
  visual: 'plain',
  role: 'middle',
  basePrice: 210,
  pricePerMmWidth: 0.45,
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

const RETAINER_EXTENSION: ModuleDef = {
  kind: 'retainer-extension',
  label: 'Retainer Extension',
  shortLabel: 'Retainer Ext.',
  description: 'Side retainer extension',
  group: 'retainer',
  length: 600,
  matchesConveyorWidth: false,
  visual: 'retainer',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 95,
  pricePerMmWidth: 0,
}

const RETAINER_CONNECTOR: ModuleDef = {
  kind: 'retainer-connector',
  label: 'Retainer Connector',
  shortLabel: 'Retainer Conn.',
  description: 'Retainer joining bracket',
  group: 'retainer',
  length: 80,
  matchesConveyorWidth: false,
  visual: 'retainer',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 38,
  pricePerMmWidth: 0,
}

const RETAINER_30_INNER: ModuleDef = {
  kind: 'retainer-30-inner',
  label: 'Retainer 30° Inner',
  shortLabel: '30° Inner',
  description: 'Inner retainer bend',
  group: 'retainer',
  length: 240,
  matchesConveyorWidth: false,
  bendDeg: 30,
  visual: 'retainer',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 72,
  pricePerMmWidth: 0,
}

const RETAINER_30_OUTER: ModuleDef = {
  kind: 'retainer-30-outer',
  label: 'Retainer 30° Outer',
  shortLabel: '30° Outer',
  description: 'Outer retainer bend',
  group: 'retainer',
  length: 280,
  matchesConveyorWidth: false,
  bendDeg: 30,
  visual: 'retainer',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 78,
  pricePerMmWidth: 0,
}

const RETAINER_45_INNER: ModuleDef = {
  kind: 'retainer-45-inner',
  label: 'Retainer 45° Inner',
  shortLabel: '45° Inner',
  description: 'Inner retainer bend',
  group: 'retainer',
  length: 260,
  matchesConveyorWidth: false,
  bendDeg: 45,
  visual: 'retainer',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 82,
  pricePerMmWidth: 0,
}

const RETAINER_45_OUTER: ModuleDef = {
  kind: 'retainer-45-outer',
  label: 'Retainer 45° Outer',
  shortLabel: '45° Outer',
  description: 'Outer retainer bend',
  group: 'retainer',
  length: 320,
  matchesConveyorWidth: false,
  bendDeg: 45,
  visual: 'retainer',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 88,
  pricePerMmWidth: 0,
}

const LEG_40X40: ModuleDef = {
  kind: 'leg-40x40',
  label: 'Leg Support Vertical 40x40',
  shortLabel: 'Leg 40x40',
  description: 'Standard vertical support',
  group: 'support',
  length: 900,
  matchesConveyorWidth: false,
  visual: 'support',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 95,
  pricePerMmWidth: 0,
}

const LEG_40X80: ModuleDef = {
  kind: 'leg-40x80',
  label: 'Leg Support Vertical 40x80',
  shortLabel: 'Leg 40x80',
  description: 'Heavy vertical support',
  group: 'support',
  length: 900,
  matchesConveyorWidth: false,
  visual: 'support',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 145,
  pricePerMmWidth: 0,
}

const BLACK_PLASTIC_WHEEL: ModuleDef = {
  kind: 'black-plastic-wheel',
  label: 'Black Plastic Wheel',
  shortLabel: 'Wheel',
  description: 'Fixed plastic wheel',
  group: 'support',
  length: 100,
  matchesConveyorWidth: false,
  visual: 'wheel',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 24,
  pricePerMmWidth: 0,
}

const CASTOR: ModuleDef = {
  kind: 'castor',
  label: 'Castor',
  shortLabel: 'Castor',
  description: 'Swivel castor',
  group: 'support',
  length: 120,
  matchesConveyorWidth: false,
  visual: 'wheel',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 38,
  pricePerMmWidth: 0,
}

const CASTOR_BRAKE: ModuleDef = {
  kind: 'castor-brake',
  label: 'Castor with Brake',
  shortLabel: 'Brake Castor',
  description: 'Locking swivel castor',
  group: 'support',
  length: 120,
  matchesConveyorWidth: false,
  visual: 'wheel',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 56,
  pricePerMmWidth: 0,
}

const TOP_ENCLOSURE: ModuleDef = {
  kind: 'top-enclosure',
  label: 'Top Enclosure',
  shortLabel: 'Top Encl.',
  description: 'Upper guarding cover',
  group: 'enclosure',
  length: 600,
  matchesConveyorWidth: true,
  visual: 'enclosure',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 280,
  pricePerMmWidth: 0.8,
}

const BOTTOM_ENCLOSURE: ModuleDef = {
  kind: 'bottom-enclosure',
  label: 'Bottom Enclosure',
  shortLabel: 'Bottom Encl.',
  description: 'Lower guarding cover',
  group: 'enclosure',
  length: 600,
  matchesConveyorWidth: true,
  visual: 'enclosure',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 240,
  pricePerMmWidth: 0.7,
}

const VARIABLE_SPEED_CONTROL: ModuleDef = {
  kind: 'variable-speed-control',
  label: 'Variable Speed Control',
  shortLabel: 'VSD',
  description: 'Variable speed drive panel',
  group: 'control',
  length: 0,
  matchesConveyorWidth: false,
  visual: 'control',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 620,
  pricePerMmWidth: 0,
}

const EMERGENCY_STOP: ModuleDef = {
  kind: 'emergency-stop',
  label: 'Emergency Stop',
  shortLabel: 'E-stop',
  description: 'Emergency stop button',
  group: 'control',
  length: 0,
  matchesConveyorWidth: false,
  visual: 'control',
  role: 'accessory',
  chainPlaceable: false,
  basePrice: 85,
  pricePerMmWidth: 0,
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
  'straight-connector': STRAIGHT_CONNECTOR,
  'angle-30': ANGLE_30,
  'angle-45': ANGLE_45,
  'doubling-link': DOUBLING_LINK,
  drive: DRIVE,
  'drive-compact': DRIVE_COMPACT,
  'retainer-extension': RETAINER_EXTENSION,
  'retainer-connector': RETAINER_CONNECTOR,
  'retainer-30-inner': RETAINER_30_INNER,
  'retainer-30-outer': RETAINER_30_OUTER,
  'retainer-45-inner': RETAINER_45_INNER,
  'retainer-45-outer': RETAINER_45_OUTER,
  'leg-40x40': LEG_40X40,
  'leg-40x80': LEG_40X80,
  'black-plastic-wheel': BLACK_PLASTIC_WHEEL,
  castor: CASTOR,
  'castor-brake': CASTOR_BRAKE,
  'top-enclosure': TOP_ENCLOSURE,
  'bottom-enclosure': BOTTOM_ENCLOSURE,
  'variable-speed-control': VARIABLE_SPEED_CONTROL,
  'emergency-stop': EMERGENCY_STOP,
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
  'straight-connector',
  'angle-30',
  'angle-45',
  'doubling-link',
  'drive',
  'drive-compact',
  'retainer-extension',
  'retainer-connector',
  'retainer-30-inner',
  'retainer-30-outer',
  'retainer-45-inner',
  'retainer-45-outer',
  'leg-40x40',
  'leg-40x80',
  'black-plastic-wheel',
  'castor',
  'castor-brake',
  'top-enclosure',
  'bottom-enclosure',
  'variable-speed-control',
  'emergency-stop',
]

export function getModule(kind: ModuleKind): ModuleDef {
  return MODULES[kind]
}

export function modulePrice(kind: ModuleKind, conveyorWidthMm: number): number {
  const def = MODULES[kind]
  const widthAdder = def.pricePerMmWidth * Math.max(0, conveyorWidthMm - 100)
  return def.basePrice + widthAdder
}
