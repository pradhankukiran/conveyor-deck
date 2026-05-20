import { useStore } from './store'

/**
 * Seeds the canvas with a Z-incline conveyor matching the PACT reference
 * drawing: feed → straight → 30° up → straight → 30° down → straight → drive.
 * Bottom run, incline section, top discharge — same geometry shape as PACT.
 */
export function seedDemoConveyor() {
  const state = useStore.getState()
  if (state.links.length > 0) return

  state.setDrawingField('title', 'PACT')
  state.setDrawingField('customer', 'Demo Customer')
  state.setDrawingField('drawingNumber', 'DWG211614')
  state.setDrawingField('belt', 'Flat top grey PP')
  state.setDrawingField('motor', '0.18 kW 3PH')
  state.setDrawingField('gearbox', '40:1')
  state.setDrawingField('control', 'VSD + E-stop')
  state.setDrawingField('feedShield', 'no')
  state.setConveyorWidth(600)

  state.addLink('feed')
  state.addLink('straight-short')

  const up = state.addLink('angle-30')
  if (up) state.setLinkVariant(up, 'incline-up')

  state.addLink('straight-long')

  const down = state.addLink('angle-30')
  if (down) state.setLinkVariant(down, 'incline-down')

  state.addLink('straight-short')
  state.addLink('drive')

  state.selectLink(null)
}
