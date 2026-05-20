import { describe, expect, it } from 'vitest'
import type { Link } from '../modules/types'
import {
  getBeltCompatibilityWarnings,
  getCompatibilityWarnings,
  getControlCompatibilityWarnings,
  getMotorCompatibilityWarnings,
  getWidthCompatibilityWarnings,
  type CompatibilityInput,
} from './rules'

const feed: Link = { id: 'L1', kind: 'feed', variant: 'horizontal' }
const straight: Link = { id: 'L2', kind: 'straight-1200', variant: 'horizontal' }
const incline45: Link = { id: 'L3', kind: 'angle-45', variant: 'incline-up' }
const compactDrive: Link = { id: 'L4', kind: 'drive-compact', variant: 'horizontal' }
const drive: Link = { id: 'L5', kind: 'drive', variant: 'horizontal' }

function input(overrides: Partial<CompatibilityInput> = {}): CompatibilityInput {
  return {
    conveyorWidthMm: 600,
    links: [feed, straight, drive],
    drawing: {
      belt: 'Flat top grey PP',
      motor: '0.37 kW 3PH',
      gearbox: '40:1',
      control: 'VSD + E-stop',
    },
    ...overrides,
  }
}

function codes(warnings: Array<{ code: string }>): string[] {
  return warnings.map((warning) => warning.code)
}

describe('compatibility rules', () => {
  it('warns when drive components are missing for a chain with a drive head', () => {
    const warnings = getCompatibilityWarnings(
      input({
        drawing: { belt: '', motor: '', gearbox: '', control: '' },
      }),
    )

    expect(codes(warnings)).toEqual([
      'belt.required_for_chain',
      'motor.required_for_drive',
      'gearbox.required_for_drive',
      'control.required_for_drive',
    ])
  })

  it('warns when the selected motor is below the recommended load range', () => {
    const warnings = getMotorCompatibilityWarnings(
      input({
        conveyorWidthMm: 1100,
        links: [feed, straight, straight, incline45, drive],
        drawing: {
          belt: 'Rubber-coated cleated',
          motor: '0.18 kW 3PH',
        },
      }),
    )

    expect(codes(warnings)).toContain('motor.undersized')
  })

  it('recommends VSD controls for inclined or high load layouts', () => {
    const warnings = getControlCompatibilityWarnings(
      input({
        links: [feed, straight, incline45, drive],
        drawing: {
          belt: 'Rubber-coated cleated',
          motor: '0.75 kW 3PH',
          control: 'DOL starter',
        },
      }),
    )

    expect(codes(warnings)).toEqual(['control.vsd_recommended'])
  })

  it('warns about belt selections that do not match the chain layout', () => {
    expect(
      codes(
        getBeltCompatibilityWarnings(
          input({
            links: [feed, straight, drive],
            drawing: { belt: 'Rubber-coated cleated' },
          }),
        ),
      ),
    ).toEqual(['belt.cleated_without_incline'])

    expect(
      codes(
        getBeltCompatibilityWarnings(
          input({
            links: [feed, straight, incline45, drive],
            drawing: { belt: 'Flat top grey PP' },
          }),
        ),
      ),
    ).toEqual(['belt.flat_top_steep_angle'])
  })

  it('validates width range, increment, and compact drive width review', () => {
    expect(codes(getWidthCompatibilityWarnings(input({ conveyorWidthMm: 1250 })))).toEqual([
      'width.out_of_range',
    ])

    expect(codes(getWidthCompatibilityWarnings(input({ conveyorWidthMm: 625 })))).toEqual([
      'width.invalid_increment',
    ])

    expect(
      codes(
        getWidthCompatibilityWarnings(
          input({
            conveyorWidthMm: 900,
            links: [feed, straight, compactDrive],
          }),
        ),
      ),
    ).toEqual(['width.compact_drive_limit'])
  })
})
