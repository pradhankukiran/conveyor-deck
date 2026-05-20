import type { ModuleDef, ModuleKind, Port } from './types'

/**
 * Belt-end ports: 'west' at x=0, 'east' at x=length.
 * y centered on the belt axis (width/2). All mm.
 */
function beltEndsBoth(length: number) {
  return (width: number): Port[] => [
    { id: 'w', kind: 'belt', facing: 'west', x: 0, y: width / 2 },
    { id: 'e', kind: 'belt', facing: 'east', x: length, y: width / 2 },
  ]
}

function beltEndOnly(length: number, side: 'east' | 'west') {
  return (width: number): Port[] => [
    {
      id: side[0]!,
      kind: 'belt',
      facing: side,
      x: side === 'east' ? length : 0,
      y: width / 2,
    },
  ]
}

function supportTopPort(footprintLen: number, footprintW: number) {
  return (_w: number): Port[] => [
    {
      id: 't',
      kind: 'support',
      facing: 'north',
      x: footprintLen / 2,
      y: footprintW / 2,
    },
  ]
}

const FEED: ModuleDef = {
  kind: 'feed',
  label: 'Feed Section',
  shortLabel: 'Feed',
  description: 'Loading hopper inlet',
  group: 'belt',
  length: 500,
  matchesConveyorWidth: true,
  ports: beltEndOnly(500, 'east'),
  visual: 'feed',
  basePrice: 480,
  pricePerMmWidth: 1.6,
}

const STRAIGHT_SHORT: ModuleDef = {
  kind: 'straight-short',
  label: 'Straight Extension (600)',
  shortLabel: 'Straight 600',
  description: 'Short belt section',
  group: 'belt',
  length: 600,
  matchesConveyorWidth: true,
  ports: beltEndsBoth(600),
  visual: 'plain',
  basePrice: 240,
  pricePerMmWidth: 0.9,
}

const STRAIGHT_LONG: ModuleDef = {
  kind: 'straight-long',
  label: 'Straight Extension (1700)',
  shortLabel: 'Straight 1700',
  description: 'Long belt section',
  group: 'belt',
  length: 1700,
  matchesConveyorWidth: true,
  ports: beltEndsBoth(1700),
  visual: 'plain',
  basePrice: 640,
  pricePerMmWidth: 1.4,
}

const ANGLE_30: ModuleDef = {
  kind: 'angle-30',
  label: '30° Angle Module',
  shortLabel: '30° Angle',
  description: 'Incline / decline bend',
  group: 'belt',
  length: 400,
  matchesConveyorWidth: true,
  ports: beltEndsBoth(400),
  visual: 'angle-30',
  basePrice: 720,
  pricePerMmWidth: 1.8,
}

const ANGLE_45: ModuleDef = {
  kind: 'angle-45',
  label: '45° Angle Module',
  shortLabel: '45° Angle',
  description: 'Steep incline / decline',
  group: 'belt',
  length: 400,
  matchesConveyorWidth: true,
  ports: beltEndsBoth(400),
  visual: 'angle-45',
  basePrice: 780,
  pricePerMmWidth: 1.8,
}

const DRIVE: ModuleDef = {
  kind: 'drive',
  label: 'Drive Module',
  shortLabel: 'Drive',
  description: 'Motor + gearbox head',
  group: 'belt',
  length: 320,
  matchesConveyorWidth: true,
  ports: beltEndOnly(320, 'west'),
  visual: 'drive',
  basePrice: 1850,
  pricePerMmWidth: 0.6,
}

const LEG_40: ModuleDef = {
  kind: 'leg-40',
  label: 'Vertical Leg 40×40',
  shortLabel: 'Leg 40',
  description: 'Aluminum extrusion support',
  group: 'support',
  length: 60,
  matchesConveyorWidth: false,
  fixedWidth: 60,
  ports: supportTopPort(60, 60),
  visual: 'leg',
  basePrice: 95,
  pricePerMmWidth: 0,
}

const LEG_80: ModuleDef = {
  kind: 'leg-80',
  label: 'Vertical Leg 40×80',
  shortLabel: 'Leg 80',
  description: 'Heavy aluminum support',
  group: 'support',
  length: 80,
  matchesConveyorWidth: false,
  fixedWidth: 60,
  ports: supportTopPort(80, 60),
  visual: 'leg',
  basePrice: 135,
  pricePerMmWidth: 0,
}

const CASTOR: ModuleDef = {
  kind: 'castor',
  label: 'Castor',
  shortLabel: 'Castor',
  description: 'Mobile foot',
  group: 'support',
  length: 80,
  matchesConveyorWidth: false,
  fixedWidth: 80,
  ports: supportTopPort(80, 80),
  visual: 'castor',
  basePrice: 38,
  pricePerMmWidth: 0,
}

const CASTOR_BRAKE: ModuleDef = {
  kind: 'castor-brake',
  label: 'Castor with Brake',
  shortLabel: 'Castor (lock)',
  description: 'Braked mobile foot',
  group: 'support',
  length: 80,
  matchesConveyorWidth: false,
  fixedWidth: 80,
  ports: supportTopPort(80, 80),
  visual: 'castor-brake',
  basePrice: 56,
  pricePerMmWidth: 0,
}

export const MODULES: Record<ModuleKind, ModuleDef> = {
  feed: FEED,
  'straight-short': STRAIGHT_SHORT,
  'straight-long': STRAIGHT_LONG,
  'angle-30': ANGLE_30,
  'angle-45': ANGLE_45,
  drive: DRIVE,
  'leg-40': LEG_40,
  'leg-80': LEG_80,
  castor: CASTOR,
  'castor-brake': CASTOR_BRAKE,
}

export const MODULE_ORDER: ModuleKind[] = [
  'feed',
  'straight-short',
  'straight-long',
  'angle-30',
  'angle-45',
  'drive',
  'leg-40',
  'leg-80',
  'castor',
  'castor-brake',
]

export function getModule(kind: ModuleKind): ModuleDef {
  return MODULES[kind]
}

/** Compute unit price for a module at a given conveyor width. */
export function modulePrice(kind: ModuleKind, conveyorWidthMm: number): number {
  const def = MODULES[kind]
  const widthAdder = def.pricePerMmWidth * Math.max(0, conveyorWidthMm - 100)
  return def.basePrice + widthAdder
}
