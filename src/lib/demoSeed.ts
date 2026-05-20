import { useStore } from './store'

/**
 * Seeds the canvas with a Z-incline conveyor mimicking the PACT reference
 * drawing — feed + straight + 30° angle + straight + drive at 600mm width,
 * with supports underneath. Run once when modules.length === 0.
 */
export function seedDemoConveyor() {
  const state = useStore.getState()
  if (state.modules.length > 0) return

  state.setDrawingField('title', 'PACT (Demo)')
  state.setDrawingField('customer', 'Fleming Demo')
  state.setDrawingField('drawingNumber', 'DWG211614')
  state.setDrawingField('belt', 'Flat top grey PP')
  state.setDrawingField('motor', '0.18 kW 3PH')
  state.setDrawingField('gearbox', '40:1')
  state.setDrawingField('control', 'VSD + E-stop')
  state.setDrawingField('feedShield', 'no')
  state.setConveyorWidth(600)

  // y=0 places the belt with top edge at the world origin.
  const beltY = 0
  let x = 0

  const feed = state.addModule('feed', x, beltY)
  x += 500 // feed length

  state.addModule('straight-short', x, beltY)
  x += 600

  state.addModule('angle-30', x, beltY)
  x += 400

  state.addModule('straight-long', x, beltY)
  x += 1700

  state.addModule('drive', x, beltY)

  // supports beneath the conveyor (top-view, offset below belt)
  const supportY = 620
  state.addModule('leg-40', 240, supportY)
  state.addModule('leg-40', 1240, supportY)
  state.addModule('leg-40', 2440, supportY)

  state.addModule('castor-brake', 240 + 80, supportY + 60)
  state.addModule('castor', 1240 + 80, supportY + 60)
  state.addModule('castor', 2440 + 80, supportY + 60)

  // The feed module was created first; select nothing so the user can explore
  state.selectModule(null)
  void feed
}
