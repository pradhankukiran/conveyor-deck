import { useState } from 'react'
import { MODULE_ORDER, getModule } from '../modules/registry'
import { MODULE_DRAG_TYPE, canInsertAt, useStore } from '../lib/store'
import type { ModuleKind } from '../modules/types'

export function ModulePalette() {
  const links = useStore((s) => s.links)
  const addLink = useStore((s) => s.addLink)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 bg-stone-50">
      <div className="border-b border-stone-200 bg-white px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Component Library
        </h2>
        <p className="mt-0.5 text-[10px] text-stone-500">
          Drag to canvas or click to add to end
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {MODULE_ORDER.map((k) => {
            const appendResult = canInsertAt(links, k, links.length)
            const canDrag = Array.from({ length: links.length + 1 }).some(
              (_, index) => canInsertAt(links, k, index).ok,
            )
            return (
              <PaletteItem
                key={k}
                kind={k}
                appendDisabled={!appendResult.ok}
                dragDisabled={!canDrag}
                disabledReason={
                  canDrag ? appendResult.reason : 'No valid position available'
                }
                onAdd={() => addLink(k)}
              />
            )
          })}
        </ul>
      </div>

      <div className="border-t border-stone-200 bg-white px-3 py-2 text-[10px] text-stone-500">
        <p>
          <strong className="text-stone-700">Rules:</strong> feed first, drive
          last, angles between belt sections.
        </p>
      </div>
    </aside>
  )
}

function PaletteItem({
  kind,
  appendDisabled,
  dragDisabled,
  disabledReason,
  onAdd,
}: {
  kind: ModuleKind
  appendDisabled: boolean
  dragDisabled: boolean
  disabledReason?: string
  onAdd: () => void
}) {
  const def = getModule(kind)
  const [showTip, setShowTip] = useState(false)
  const disabled = appendDisabled && dragDisabled

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    if (dragDisabled) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData(MODULE_DRAG_TYPE, kind)
    e.dataTransfer.setData(`${MODULE_DRAG_TYPE}:${kind}`, kind)
    e.dataTransfer.setData('text/plain', def.label)
  }

  return (
    <li className="relative">
      <button
        type="button"
        disabled={disabled}
        draggable={!dragDisabled}
        onDragStart={handleDragStart}
        onClick={onAdd}
        onMouseEnter={() => (appendDisabled || dragDisabled) && setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className="group flex w-full cursor-grab items-center gap-2.5 rounded border border-transparent px-1.5 py-1.5 text-left transition hover:border-stone-300 hover:bg-white active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-transparent disabled:hover:bg-transparent"
      >
        <ModuleThumb kind={kind} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-mono text-[12px] font-semibold text-stone-800">
            {def.shortLabel}
          </div>
          <div className="truncate text-[10px] text-stone-500">
            {def.description}
          </div>
        </div>
        {!appendDisabled && (
          <span className="text-[10px] font-semibold text-orange-500 opacity-0 transition group-hover:opacity-100">
            ADD
          </span>
        )}
      </button>
      {(appendDisabled || dragDisabled) && showTip && disabledReason && (
        <div className="absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-[10px] text-white shadow-lg">
          {disabledReason}
        </div>
      )}
    </li>
  )
}

function ModuleThumb({ kind }: { kind: ModuleKind }) {
  const def = getModule(kind)
  return (
    <div className="grid size-10 shrink-0 place-items-center rounded-sm border border-stone-300 bg-white">
      <svg viewBox="0 0 40 40" className="size-9">
        {def.visual === 'feed' && <FeedThumb />}
        {def.visual === 'plain' && <StraightThumb />}
        {def.visual === 'angle-30' && <AngleThumb deg={30} />}
        {def.visual === 'angle-45' && <AngleThumb deg={45} />}
        {def.visual === 'drive' && <DriveThumb />}
      </svg>
    </div>
  )
}

const STROKE = '#0a0a0a'

function StraightThumb() {
  return (
    <g fill="none" stroke={STROKE} strokeWidth={1}>
      <rect x="4" y="13" width="32" height="14" />
      <line
        x1="4"
        y1="20"
        x2="36"
        y2="20"
        stroke="#737373"
        strokeDasharray="3 1 1 1"
      />
      <line x1="14" y1="14" x2="14" y2="26" stroke="#737373" />
      <line x1="22" y1="14" x2="22" y2="26" stroke="#737373" />
      <line x1="30" y1="14" x2="30" y2="26" stroke="#737373" />
    </g>
  )
}

function FeedThumb() {
  return (
    <g fill="none" stroke={STROKE} strokeWidth={1}>
      <rect x="4" y="13" width="32" height="14" />
      <rect x="9" y="16" width="22" height="8" stroke="#0a0a0a" />
      <line x1="11" y1="24" x2="29" y2="16" stroke="#737373" strokeWidth={0.5} />
      <line x1="13" y1="24" x2="31" y2="16" stroke="#737373" strokeWidth={0.5} />
      <line x1="15" y1="24" x2="33" y2="16" stroke="#737373" strokeWidth={0.5} />
    </g>
  )
}

function AngleThumb({ deg }: { deg: number }) {
  return (
    <g fill="none" stroke={STROKE} strokeWidth={1}>
      <rect x="4" y="13" width="32" height="14" />
      <line x1="6" y1="20" x2="20" y2="20" strokeWidth={1.5} />
      <line
        x1="20"
        y1="20"
        x2={20 + 14 * Math.cos((-deg * Math.PI) / 180)}
        y2={20 + 14 * Math.sin((-deg * Math.PI) / 180)}
        strokeWidth={1.5}
      />
      <text
        x="26"
        y="32"
        fontSize="7"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
        fill={STROKE}
      >
        {deg}°
      </text>
    </g>
  )
}

function DriveThumb() {
  return (
    <g fill="none" stroke={STROKE} strokeWidth={1}>
      <rect x="4" y="10" width="24" height="12" />
      <rect x="16" y="22" width="20" height="10" fill="#1f1f1f" stroke="#0a0a0a" />
      <circle cx="26" cy="16" r="3" fill="white" />
      <circle cx="26" cy="16" r="0.8" fill="#0a0a0a" />
    </g>
  )
}
