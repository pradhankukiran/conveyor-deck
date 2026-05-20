import { MODULE_ORDER, getModule } from '../modules/registry'
import { MODULE_DRAG_TYPE } from '../lib/store'
import type { ModuleKind } from '../modules/types'

export function ModulePalette() {
  const beltKinds = MODULE_ORDER.filter((k) => getModule(k).group === 'belt')
  const supportKinds = MODULE_ORDER.filter(
    (k) => getModule(k).group === 'support',
  )

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Modules
        </h2>
        <p className="mt-0.5 text-[10px] text-stone-400">
          Drag onto canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <Group title="Belt">
          {beltKinds.map((k) => (
            <PaletteItem key={k} kind={k} />
          ))}
        </Group>
        <Group title="Supports">
          {supportKinds.map((k) => (
            <PaletteItem key={k} kind={k} />
          ))}
        </Group>
      </div>
    </aside>
  )
}

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        {title}
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  )
}

function PaletteItem({ kind }: { kind: ModuleKind }) {
  const def = getModule(kind)
  return (
    <li>
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(MODULE_DRAG_TYPE, kind)
          e.dataTransfer.effectAllowed = 'copy'
        }}
        className="group flex w-full cursor-grab items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left hover:border-stone-200 hover:bg-stone-50 active:cursor-grabbing"
      >
        <ModuleThumb kind={kind} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium text-stone-800">
            {def.shortLabel}
          </div>
          <div className="truncate text-[11px] text-stone-500">
            {def.description}
          </div>
        </div>
      </button>
    </li>
  )
}

function ModuleThumb({ kind }: { kind: ModuleKind }) {
  const def = getModule(kind)
  if (def.visual === 'feed' || def.visual === 'plain') {
    return (
      <div className="grid size-9 shrink-0 place-items-center rounded border border-stone-300 bg-amber-50">
        <div className="h-3 w-6 rounded-sm border border-stone-400 bg-amber-100" />
      </div>
    )
  }
  if (def.visual === 'angle-30' || def.visual === 'angle-45') {
    return (
      <div className="grid size-9 shrink-0 place-items-center rounded border border-stone-300 bg-amber-100 text-[9px] font-bold text-stone-700">
        {def.visual === 'angle-30' ? '30°' : '45°'}
      </div>
    )
  }
  if (def.visual === 'drive') {
    return (
      <div className="relative grid size-9 shrink-0 place-items-center rounded border border-stone-300 bg-amber-50">
        <div className="h-3 w-5 rounded-sm border border-stone-400 bg-amber-100" />
        <div className="absolute right-0.5 bottom-0.5 grid size-3 place-items-center rounded-sm bg-sky-900 text-[7px] font-bold text-white">
          M
        </div>
      </div>
    )
  }
  if (def.visual === 'leg') {
    return (
      <div className="grid size-9 shrink-0 place-items-center rounded border border-stone-300 bg-white">
        <div className="size-3.5 border-2 border-stone-500 bg-stone-300" />
      </div>
    )
  }
  if (def.visual === 'castor' || def.visual === 'castor-brake') {
    return (
      <div className="relative grid size-9 shrink-0 place-items-center rounded border border-stone-300 bg-white">
        <div className="size-4 rounded-full border border-stone-700 bg-stone-900" />
        {def.visual === 'castor-brake' && (
          <div className="absolute right-1 bottom-0.5 h-1 w-3 rounded-sm bg-red-500" />
        )}
      </div>
    )
  }
  return (
    <div className="grid size-9 shrink-0 place-items-center rounded border border-stone-300 bg-white" />
  )
}
