type PaletteItem = {
  id: string
  label: string
  hint: string
}

const ITEMS: PaletteItem[] = [
  { id: 'feed', label: 'Feed', hint: 'Loading section' },
  { id: 'straight', label: 'Straight', hint: 'Extension' },
  { id: 'angle-30', label: '30° Angle', hint: 'Incline / decline' },
  { id: 'angle-45', label: '45° Angle', hint: 'Incline / decline' },
  { id: 'drive', label: 'Drive', hint: 'Motor + gearbox' },
  { id: 'leg-40x40', label: 'Leg 40×40', hint: 'Vertical support' },
  { id: 'leg-40x80', label: 'Leg 40×80', hint: 'Heavy support' },
  { id: 'castor', label: 'Castor', hint: 'Mobile foot' },
  { id: 'castor-lock', label: 'Castor (lock)', hint: 'Braked foot' },
]

export function ModulePalette() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Modules
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="group flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left hover:border-stone-200 hover:bg-stone-50"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded border border-stone-300 bg-stone-100 text-[10px] font-medium text-stone-500 group-hover:border-stone-400">
                  {item.label.split(' ')[0].slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-medium text-stone-800">
                    {item.label}
                  </div>
                  <div className="truncate text-[11px] text-stone-500">
                    {item.hint}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
