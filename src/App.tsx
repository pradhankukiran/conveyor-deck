import { TopBar } from './components/TopBar'
import { ModulePalette } from './components/ModulePalette'
import { CanvasArea } from './components/CanvasArea'
import { PropertiesPanel } from './components/PropertiesPanel'

export default function App() {
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
