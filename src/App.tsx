import { useEffect } from 'react'
import { TopBar } from './components/TopBar'
import { ModulePalette } from './components/ModulePalette'
import { CanvasArea } from './components/CanvasArea'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toaster } from './components/Toaster'
import { seedDemoConveyor } from './lib/demoSeed'
import { useStore } from './lib/store'
import { installHistory } from './lib/history'

export default function App() {
  useEffect(() => {
    installHistory()
    seedDemoConveyor()
    // Defer one tick so CanvasArea has measured its viewport before fitting.
    const id = requestAnimationFrame(() => {
      useStore.getState().requestViewReset()
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="relative flex h-full flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ModulePalette />
        <CanvasArea />
        <PropertiesPanel />
      </div>
      <Toaster />
    </div>
  )
}
