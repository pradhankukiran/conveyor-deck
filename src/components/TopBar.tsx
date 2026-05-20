import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  FileDown,
  FileSpreadsheet,
  FileUp,
  Loader2,
  RotateCcw,
  Undo2,
  Redo2,
} from 'lucide-react'
import { exportConveyorPdf } from '../lib/exportPdf'
import { exportConveyorExcel } from '../lib/exportExcel'
import {
  createProjectFile,
  downloadProjectFile,
  readProjectFile,
} from '../lib/projectFile'
import { useStore } from '../lib/store'
import { seedDemoConveyor } from '../lib/demoSeed'
import { redo, undo, useHistoryStatus } from '../lib/history'

export function TopBar() {
  const [pdfBusy, setPdfBusy] = useState(false)
  const [jsonBusy, setJsonBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const clear = useStore((s) => s.clear)
  const requestViewReset = useStore((s) => s.requestViewReset)
  const pushToast = useStore((s) => s.pushToast)
  const { canUndo, canRedo } = useHistoryStatus()

  const onExportPdf = async () => {
    if (pdfBusy) return
    setPdfBusy(true)
    try {
      await exportConveyorPdf()
    } catch (err) {
      console.error(err)
    } finally {
      setPdfBusy(false)
    }
  }

  const onExportExcel = () => {
    try {
      exportConveyorExcel()
    } catch (err) {
      console.error(err)
    }
  }

  const onExportProject = () => {
    try {
      downloadProjectFile(createProjectFile(useStore.getState()))
      pushToast('Project JSON exported')
    } catch (err) {
      console.error(err)
      pushToast('Could not export project JSON')
    }
  }

  const onImportProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file || jsonBusy) return

    setJsonBusy(true)
    try {
      const project = await readProjectFile(file)
      useStore.setState({ ...project.state, selectedLinkId: null })
      requestAnimationFrame(() => requestViewReset())
      pushToast('Project JSON imported')
    } catch (err) {
      console.error(err)
      pushToast('Could not import project JSON')
    } finally {
      setJsonBusy(false)
    }
  }

  const onReset = () => {
    if (
      !confirm(
        'Reset to the PACT demo conveyor? This clears your current chain.',
      )
    )
      return
    clear()
    seedDemoConveyor()
    requestAnimationFrame(() => requestViewReset())
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className="grid size-8 place-items-center rounded-md text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          className="grid size-8 place-items-center rounded-md text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onImportProject}
          className="hidden"
        />
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
        >
          <RotateCcw className="size-4" />
          Reset to PACT
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={jsonBusy}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {jsonBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileUp className="size-4" />
          )}
          Import JSON
        </button>
        <button
          type="button"
          onClick={onExportProject}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
        >
          <FileDown className="size-4" />
          Export JSON
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
        >
          <FileSpreadsheet className="size-4" />
          Excel
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={pdfBusy}
          className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pdfBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          Export PDF
        </button>
      </div>
    </header>
  )
}
