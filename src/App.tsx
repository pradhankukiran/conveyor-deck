import { useEffect } from 'react'
import { TopBar } from './components/TopBar'
import { ModulePalette } from './components/ModulePalette'
import { CanvasArea } from './components/CanvasArea'
import { PropertiesPanel } from './components/PropertiesPanel'
import { seedDemoConveyor } from './lib/demoSeed'
import { useStore } from './lib/store'

export default function App() {
  useEffect(() => {
    seedDemoConveyor()
    // Defer one tick so CanvasArea has measured its viewport before fitting.
    const id = requestAnimationFrame(() => {
      useStore.getState().requestViewReset()
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ModulePalette />
        <CanvasArea />
        <PropertiesPanel />
      </div>
    </div>
  )
}
