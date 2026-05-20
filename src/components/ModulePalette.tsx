import { MODULE_ORDER, getModule } from '../modules/registry'
import { MODULE_DRAG_TYPE } from '../lib/store'
import type { ModuleKind } from '../modules/types'

export function ModulePalette() {
  const beltKinds = MODULE_ORDER.filter((k) => getModule(k).group === 'belt')
  const supportKinds = MODULE_ORDER.filter(
    (k) => getModule(k).group === 'support',
  )

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 bg-stone-50">
      <div className="border-b border-stone-200 bg-white px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Component Library
        </h2>
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
      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        {title}
      </div>
      <ul className="space-y-0.5">{children}</ul>
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
        className="group flex w-full cursor-grab items-center gap-2.5 rounded border border-transparent px-1.5 py-1.5 text-left hover:border-stone-300 hover:bg-white active:cursor-grabbing"
      >
        <ModuleThumb kind={kind} />
        <div className="min-w-0 leading-tight">
          <div className="truncate font-mono text-[12px] font-semibold text-stone-800">
            {def.shortLabel}
          </div>
          <div className="truncate text-[10px] text-stone-500">
            {def.description}
          </div>
        </div>
      </button>
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
        {def.visual === 'leg' && <LegThumb />}
        {def.visual === 'castor' && <CastorThumb />}
        {def.visual === 'castor-brake' && <CastorThumb brake />}
      </svg>
    </div>
  )
}

const STROKE = '#0a0a0a'

function StraightThumb() {
  return (
    <g fill="none" stroke={STROKE} strokeWidth={1}>
      <rect x="4" y="13" width="32" height="14" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="#737373" strokeDasharray="3 1 1 1" />
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

function LegThumb() {
  return (
    <g fill="none" stroke={STROKE} strokeWidth={1}>
      <rect x="11" y="11" width="18" height="18" />
      <rect x="16" y="16" width="8" height="8" stroke="#0a0a0a" strokeWidth={0.7} />
      <line x1="11" y1="11" x2="29" y2="29" stroke="#737373" strokeWidth={0.6} />
      <line x1="29" y1="11" x2="11" y2="29" stroke="#737373" strokeWidth={0.6} />
    </g>
  )
}

function CastorThumb({ brake }: { brake?: boolean }) {
  return (
    <g fill="none" stroke={STROKE} strokeWidth={1}>
      <rect x="6" y="6" width="28" height="28" />
      <circle cx="20" cy="20" r="11" />
      <rect x="12" y="18" width="16" height="4" fill="#1f1f1f" stroke="#0a0a0a" />
      {brake && <rect x="14" y="29" width="12" height="2.5" fill="#dc2626" />}
    </g>
  )
}
