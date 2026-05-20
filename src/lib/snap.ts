import type { ModuleInstance, Port, PortFacing } from '../modules/types'
import { MODULES } from '../modules/registry'

export const SNAP_THRESHOLD = 80 // mm

const FACING_INDEX: Record<PortFacing, number> = {
  east: 0,
  south: 1,
  west: 2,
  north: 3,
}
const INDEX_FACING: PortFacing[] = ['east', 'south', 'west', 'north']

function rotateFacing(facing: PortFacing, rotationDeg: number): PortFacing {
  const turns = Math.round(rotationDeg / 90)
  const idx = (FACING_INDEX[facing] + turns + 400) % 4
  return INDEX_FACING[idx]!
}

function complementary(a: PortFacing, b: PortFacing): boolean {
  return (
    (a === 'east' && b === 'west') ||
    (a === 'west' && b === 'east') ||
    (a === 'north' && b === 'south') ||
    (a === 'south' && b === 'north')
  )
}

export type PortWorld = {
  x: number
  y: number
  facing: PortFacing
  kind: Port['kind']
  portId: string
}

export function worldPort(
  inst: Pick<ModuleInstance, 'x' | 'y' | 'rotation'>,
  port: Port,
): PortWorld {
  const rad = (inst.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: inst.x + port.x * cos - port.y * sin,
    y: inst.y + port.x * sin + port.y * cos,
    facing: rotateFacing(port.facing, inst.rotation),
    kind: port.kind,
    portId: port.id,
  }
}

export type SnapResult = {
  /** New top-left position of the dragged module after snapping */
  x: number
  y: number
  /** Where the snap target sits in world coords (for the indicator) */
  target: { x: number; y: number }
  draggedPortId: string
  staticInstanceId: string
  staticPortId: string
}

export function computeSnap(
  modules: ModuleInstance[],
  candidate: {
    id: string
    kind: ModuleInstance['kind']
    x: number
    y: number
    rotation: number
  },
  conveyorWidth: number,
): SnapResult | null {
  const draggedDef = MODULES[candidate.kind]
  const draggedPorts = draggedDef.ports(conveyorWidth)

  let best: SnapResult | null = null
  let bestDist = SNAP_THRESHOLD

  for (const other of modules) {
    if (other.id === candidate.id) continue
    const otherDef = MODULES[other.kind]
    const otherPorts = otherDef.ports(conveyorWidth)

    for (const op of otherPorts) {
      const ow = worldPort(other, op)
      for (const dp of draggedPorts) {
        if (dp.kind !== op.kind) continue
        const dw = worldPort(candidate, dp)
        if (!complementary(dw.facing, ow.facing)) continue
        const dx = ow.x - dw.x
        const dy = ow.y - dw.y
        const dist = Math.hypot(dx, dy)
        if (dist < bestDist) {
          bestDist = dist
          best = {
            x: candidate.x + dx,
            y: candidate.y + dy,
            target: { x: ow.x, y: ow.y },
            draggedPortId: dp.id,
            staticInstanceId: other.id,
            staticPortId: op.id,
          }
        }
      }
    }
  }
  return best
}

/** Returns all world-space ports across all modules — for visual debugging / decorations. */
export function allWorldPorts(
  modules: ModuleInstance[],
  conveyorWidth: number,
): Array<PortWorld & { instanceId: string }> {
  const out: Array<PortWorld & { instanceId: string }> = []
  for (const inst of modules) {
    const def = MODULES[inst.kind]
    for (const p of def.ports(conveyorWidth)) {
      out.push({ ...worldPort(inst, p), instanceId: inst.id })
    }
  }
  return out
}
