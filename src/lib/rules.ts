import type { Link } from '../modules/types'
import { MODULES } from '../modules/registry'

export type CompatibilityField = 'motor' | 'gearbox' | 'control' | 'belt' | 'width'

export type RuleWarning = {
  code: string
  field: CompatibilityField
  message: string
}

export type DrawingSpec = {
  belt?: string | null
  motor?: string | null
  gearbox?: string | null
  control?: string | null
}

export type CompatibilityInput = {
  drawing: DrawingSpec
  conveyorWidthMm: number
  links: readonly Link[]
}

type ChainStats = {
  pathLengthMm: number
  pathLengthM: number
  hasDrive: boolean
  hasCompactDrive: boolean
  hasIncline: boolean
  hasAngle45: boolean
  angleCount: number
}

const MIN_WIDTH_MM = 100
const MAX_WIDTH_MM = 1200
const WIDTH_STEP_MM = 50

const KNOWN_BELTS = new Set([
  'Flat top grey PP',
  'Modular plastic chain',
  'Rubber-coated cleated',
  'Wire mesh',
])

const KNOWN_CONTROLS = new Set([
  'DOL starter',
  'VSD + E-stop',
  'PLC integrated',
])

const KNOWN_GEARBOX_RATIOS = new Set(['20:1', '30:1', '40:1', '60:1'])

function selected(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function chainStats(links: readonly Link[]): ChainStats {
  let pathLengthMm = 0
  let hasDrive = false
  let hasCompactDrive = false
  let hasIncline = false
  let hasAngle45 = false
  let angleCount = 0

  for (const link of links) {
    const def = MODULES[link.kind]
    pathLengthMm += def.length

    if (def.role === 'drive') hasDrive = true
    if (link.kind === 'drive-compact') hasCompactDrive = true

    if (def.role === 'angle') {
      angleCount += 1
      if (link.variant !== 'horizontal') hasIncline = true
      if ((def.bendDeg ?? 0) >= 45) hasAngle45 = true
    }
  }

  return {
    pathLengthMm,
    pathLengthM: pathLengthMm / 1000,
    hasDrive,
    hasCompactDrive,
    hasIncline,
    hasAngle45,
    angleCount,
  }
}

function parseMotorKw(motor: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*kW\b/i.exec(motor)
  return match ? Number(match[1]) : null
}

function parseGearboxRatio(gearbox: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*:/i.exec(gearbox)
  return match ? Number(match[1]) : null
}

function beltLoadFactor(belt: string): number {
  if (belt === 'Rubber-coated cleated') return 1.3
  if (belt === 'Wire mesh') return 1.2
  if (belt === 'Modular plastic chain') return 1.05
  return 1
}

function recommendedMotorKw(input: CompatibilityInput): number | null {
  const stats = chainStats(input.links)
  if (!stats.hasDrive) return null

  const belt = selected(input.drawing.belt)
  const loadScore =
    stats.pathLengthM *
    (input.conveyorWidthMm / 600) *
    beltLoadFactor(belt) *
    (stats.hasIncline ? 1.35 : 1)

  if (
    stats.pathLengthMm > 8000 ||
    input.conveyorWidthMm > 1100 ||
    loadScore > 9
  ) {
    return 1.5
  }

  if (
    stats.pathLengthMm > 5000 ||
    input.conveyorWidthMm > 900 ||
    stats.hasAngle45 ||
    loadScore > 5
  ) {
    return 0.75
  }

  if (
    stats.pathLengthMm > 2500 ||
    input.conveyorWidthMm > 600 ||
    stats.hasIncline ||
    belt === 'Rubber-coated cleated' ||
    belt === 'Wire mesh'
  ) {
    return 0.37
  }

  return 0.18
}

export function getMotorCompatibilityWarnings(
  input: CompatibilityInput,
): RuleWarning[] {
  const stats = chainStats(input.links)
  const motor = selected(input.drawing.motor)
  const warnings: RuleWarning[] = []

  if (stats.hasDrive && !motor) {
    warnings.push({
      code: 'motor.required_for_drive',
      field: 'motor',
      message: 'Select a motor for the drive head.',
    })
    return warnings
  }

  if (!stats.hasDrive && motor) {
    warnings.push({
      code: 'motor.selected_without_drive',
      field: 'motor',
      message: 'A motor is selected but the chain has no drive head.',
    })
    return warnings
  }

  if (!motor) return warnings

  const motorKw = parseMotorKw(motor)
  if (motorKw === null) {
    warnings.push({
      code: 'motor.unknown_rating',
      field: 'motor',
      message: `Motor rating "${motor}" is not recognised.`,
    })
    return warnings
  }

  const recommendedKw = recommendedMotorKw(input)
  if (recommendedKw !== null && motorKw < recommendedKw) {
    warnings.push({
      code: 'motor.undersized',
      field: 'motor',
      message: `${motor} may be undersized; use at least ${recommendedKw} kW for this width and chain layout.`,
    })
  }

  if (stats.hasCompactDrive && motorKw > 0.75) {
    warnings.push({
      code: 'motor.compact_drive_large_motor',
      field: 'motor',
      message: 'Compact drive heads should be checked before using motors above 0.75 kW.',
    })
  }

  return warnings
}

export function getGearboxCompatibilityWarnings(
  input: CompatibilityInput,
): RuleWarning[] {
  const stats = chainStats(input.links)
  const gearbox = selected(input.drawing.gearbox)
  const belt = selected(input.drawing.belt)
  const warnings: RuleWarning[] = []

  if (stats.hasDrive && !gearbox) {
    warnings.push({
      code: 'gearbox.required_for_drive',
      field: 'gearbox',
      message: 'Select a gearbox ratio for the drive head.',
    })
    return warnings
  }

  if (!stats.hasDrive && gearbox) {
    warnings.push({
      code: 'gearbox.selected_without_drive',
      field: 'gearbox',
      message: 'A gearbox is selected but the chain has no drive head.',
    })
    return warnings
  }

  if (!gearbox) return warnings

  const ratio = parseGearboxRatio(gearbox)
  if (ratio === null || !KNOWN_GEARBOX_RATIOS.has(gearbox)) {
    warnings.push({
      code: 'gearbox.unknown_ratio',
      field: 'gearbox',
      message: `Gearbox ratio "${gearbox}" is not recognised.`,
    })
    return warnings
  }

  if (
    ratio < 30 &&
    (stats.hasIncline || belt === 'Rubber-coated cleated' || input.conveyorWidthMm > 900)
  ) {
    warnings.push({
      code: 'gearbox.low_torque_ratio',
      field: 'gearbox',
      message: '20:1 gearing may not provide enough torque for inclined, cleated, or wide conveyors.',
    })
  }

  if (ratio < 40 && (recommendedMotorKw(input) ?? 0) >= 0.75) {
    warnings.push({
      code: 'gearbox.review_ratio_for_load',
      field: 'gearbox',
      message: 'Review gearbox ratio; this layout is in the higher motor load range.',
    })
  }

  if (ratio >= 60 && !stats.hasIncline && stats.pathLengthMm > 0 && stats.pathLengthMm < 2000) {
    warnings.push({
      code: 'gearbox.high_reduction_short_run',
      field: 'gearbox',
      message: '60:1 gearing may be slower than needed for a short, flat conveyor.',
    })
  }

  return warnings
}

export function getControlCompatibilityWarnings(
  input: CompatibilityInput,
): RuleWarning[] {
  const stats = chainStats(input.links)
  const control = selected(input.drawing.control)
  const belt = selected(input.drawing.belt)
  const motorKw = parseMotorKw(selected(input.drawing.motor)) ?? 0
  const warnings: RuleWarning[] = []

  if (stats.hasDrive && !control) {
    warnings.push({
      code: 'control.required_for_drive',
      field: 'control',
      message: 'Select a control package for the drive head.',
    })
    return warnings
  }

  if (!stats.hasDrive && control) {
    warnings.push({
      code: 'control.selected_without_drive',
      field: 'control',
      message: 'A control package is selected but the chain has no drive head.',
    })
    return warnings
  }

  if (!control) return warnings

  if (!KNOWN_CONTROLS.has(control)) {
    warnings.push({
      code: 'control.unknown_package',
      field: 'control',
      message: `Control package "${control}" is not recognised.`,
    })
    return warnings
  }

  if (
    control === 'DOL starter' &&
    (stats.hasIncline || belt === 'Rubber-coated cleated' || belt === 'Wire mesh' || motorKw >= 0.75)
  ) {
    warnings.push({
      code: 'control.vsd_recommended',
      field: 'control',
      message: 'Use VSD + E-stop for inclined, cleated, wire mesh, or 0.75 kW+ drives.',
    })
  }

  return warnings
}

export function getBeltCompatibilityWarnings(
  input: CompatibilityInput,
): RuleWarning[] {
  const stats = chainStats(input.links)
  const belt = selected(input.drawing.belt)
  const warnings: RuleWarning[] = []

  if (input.links.length > 0 && !belt) {
    warnings.push({
      code: 'belt.required_for_chain',
      field: 'belt',
      message: 'Select a belt type for the conveyor chain.',
    })
    return warnings
  }

  if (!belt) return warnings

  if (!KNOWN_BELTS.has(belt)) {
    warnings.push({
      code: 'belt.unknown_type',
      field: 'belt',
      message: `Belt type "${belt}" is not recognised.`,
    })
    return warnings
  }

  if (belt === 'Wire mesh' && stats.angleCount > 0) {
    warnings.push({
      code: 'belt.wire_mesh_angles',
      field: 'belt',
      message: 'Wire mesh belts should be reviewed before using angle modules.',
    })
  }

  if (belt === 'Rubber-coated cleated' && !stats.hasIncline) {
    warnings.push({
      code: 'belt.cleated_without_incline',
      field: 'belt',
      message: 'Cleated belts are usually only needed when the chain includes an incline.',
    })
  }

  if (belt === 'Flat top grey PP' && stats.hasAngle45) {
    warnings.push({
      code: 'belt.flat_top_steep_angle',
      field: 'belt',
      message: 'Flat top grey PP may slip on 45 degree incline modules; consider a cleated belt.',
    })
  }

  return warnings
}

export function getWidthCompatibilityWarnings(
  input: CompatibilityInput,
): RuleWarning[] {
  const stats = chainStats(input.links)
  const width = input.conveyorWidthMm
  const warnings: RuleWarning[] = []

  if (!Number.isFinite(width) || width < MIN_WIDTH_MM || width > MAX_WIDTH_MM) {
    warnings.push({
      code: 'width.out_of_range',
      field: 'width',
      message: `Conveyor width must be between ${MIN_WIDTH_MM} mm and ${MAX_WIDTH_MM} mm.`,
    })
    return warnings
  }

  if ((width - MIN_WIDTH_MM) % WIDTH_STEP_MM !== 0) {
    warnings.push({
      code: 'width.invalid_increment',
      field: 'width',
      message: `Conveyor width should use ${WIDTH_STEP_MM} mm increments.`,
    })
  }

  if (stats.hasCompactDrive && width > 800) {
    warnings.push({
      code: 'width.compact_drive_limit',
      field: 'width',
      message: 'Compact drive heads should be reviewed above 800 mm conveyor width.',
    })
  }

  if (stats.hasAngle45 && width > 1000) {
    warnings.push({
      code: 'width.wide_steep_angle',
      field: 'width',
      message: '45 degree angle modules above 1000 mm width need engineering review.',
    })
  }

  return warnings
}

export function getCompatibilityWarnings(
  input: CompatibilityInput,
): RuleWarning[] {
  return [
    ...getWidthCompatibilityWarnings(input),
    ...getBeltCompatibilityWarnings(input),
    ...getMotorCompatibilityWarnings(input),
    ...getGearboxCompatibilityWarnings(input),
    ...getControlCompatibilityWarnings(input),
  ]
}
