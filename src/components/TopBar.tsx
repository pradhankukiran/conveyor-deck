import { Boxes, FileDown, FileSpreadsheet } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-md bg-orange-500 text-white">
          <Boxes className="size-5" strokeWidth={2.25} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-stone-900">
            ConveyorDeck
          </span>
          <span className="text-[11px] text-stone-500">
            Modular Conveyor Designer
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <FileSpreadsheet className="size-4" />
          Excel
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          <FileDown className="size-4" />
          Export PDF
        </button>
      </div>
    </header>
  )
}
