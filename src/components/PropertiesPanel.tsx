import { useMemo } from 'react'
import { ArrowUp, ArrowDown, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { DrawingMeta } from '../lib/store'
import { getModule } from '../modules/registry'
import { computeBom, formatAud, formatMm } from '../lib/bom'

const WIDTH_OPTIONS: number[] = Array.from(
  { length: (1200 - 100) / 50 + 1 },
  (_, i) => 100 + i * 50,
)

const BELT_OPTIONS = [
  'Flat top grey PP',
  'Modular plastic chain',
  'Rubber-coated cleated',
  'Wire mesh',
]
const MOTOR_OPTIONS = ['0.18 kW 3PH', '0.37 kW 3PH', '0.75 kW 3PH', '1.5 kW 3PH']
const GEARBOX_OPTIONS = ['20:1', '30:1', '40:1', '60:1']
const CONTROL_OPTIONS = ['DOL starter', 'VSD + E-stop', 'PLC integrated']

export function PropertiesPanel() {
  const title = useStore((s) => s.drawing.title)
  const customer = useStore((s) => s.drawing.customer)
  const drawingNumber = useStore((s) => s.drawing.drawingNumber)
  const belt = useStore((s) => s.drawing.belt)
  const motor = useStore((s) => s.drawing.motor)
  const gearbox = useStore((s) => s.drawing.gearbox)
  const control = useStore((s) => s.drawing.control)
  const feedShield = useStore((s) => s.drawing.feedShield)
  const setDrawingField = useStore((s) => s.setDrawingField)

  const conveyorWidth = useStore((s) => s.conveyorWidth)
  const setConveyorWidth = useStore((s) => s.setConveyorWidth)

  const links = useStore((s) => s.links)
  const selectedLinkId = useStore((s) => s.selectedLinkId)
  const removeLink = useStore((s) => s.removeLink)
  const moveLink = useStore((s) => s.moveLink)
  const setLinkVariant = useStore((s) => s.setLinkVariant)
  const selectLink = useStore((s) => s.selectLink)

  const drawing = useStore((s) => s.drawing)
  const bom = useMemo(
    () => computeBom(links, conveyorWidth, drawing),
    [links, conveyorWidth, drawing],
  )

  const handleDrawingChange =
    <K extends keyof DrawingMeta>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDrawingField(key, e.target.value as DrawingMeta[K])
    }

  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Configuration
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Drawing">
          <TextField
            label="Title"
            value={title}
            placeholder="e.g. PACT"
            onChange={handleDrawingChange('title')}
          />
          <TextField
            label="Customer"
            value={customer}
            placeholder="Customer name"
            onChange={handleDrawingChange('customer')}
          />
          <TextField
            label="Drawing No."
            value={drawingNumber}
            placeholder="DWG211614"
            onChange={handleDrawingChange('drawingNumber')}
          />
        </Section>

        <Section title="Conveyor specs">
          <SelectField
            label="Width"
            value={String(conveyorWidth)}
            onChange={(e) => setConveyorWidth(Number(e.target.value))}
          >
            {WIDTH_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w} mm
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Belt"
            value={belt}
            onChange={handleDrawingChange('belt')}
          >
            <option value="">Select belt…</option>
            {BELT_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Motor"
            value={motor}
            onChange={handleDrawingChange('motor')}
          >
            <option value="">Select motor…</option>
            {MOTOR_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Gearbox"
            value={gearbox}
            onChange={handleDrawingChange('gearbox')}
          >
            <option value="">Select gearbox…</option>
            {GEARBOX_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Control"
            value={control}
            onChange={handleDrawingChange('control')}
          >
            <option value="">Select control…</option>
            {CONTROL_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>

          <fieldset className="flex flex-col gap-1 text-xs">
            <legend className="text-stone-600">Feed Shield</legend>
            <div className="flex gap-3 pt-1">
              <RadioOption
                name="feedShield"
                value="yes"
                checked={feedShield === 'yes'}
                onChange={() => setDrawingField('feedShield', 'yes')}
                label="Yes"
              />
              <RadioOption
                name="feedShield"
                value="no"
                checked={feedShield === 'no'}
                onChange={() => setDrawingField('feedShield', 'no')}
                label="No"
              />
            </div>
          </fieldset>
        </Section>

        <Section title="Chain order">
          {links.length === 0 ? (
            <p className="text-xs text-stone-500">
              No links yet. Add a Feed section from the library.
            </p>
          ) : (
            <ul className="space-y-1">
              {links.map((l, i) => {
                const def = getModule(l.kind)
                const isAngle = def.role === 'angle'
                const isSelected = l.id === selectedLinkId
                return (
                  <li
                    key={l.id}
                    className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <span className="w-5 text-center font-mono text-[10px] text-stone-400">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectLink(l.id)}
                      className="flex-1 truncate text-left font-mono text-[12px] font-semibold text-stone-800"
                    >
                      {def.shortLabel}
                      {isAngle && (
                        <span className="ml-2 text-[10px] font-normal text-stone-500">
                          {l.variant === 'incline-up'
                            ? '↗ up'
                            : l.variant === 'incline-down'
                              ? '↘ down'
                              : '→'}
                        </span>
                      )}
                    </button>
                    {isAngle && (
                      <div className="flex">
                        <IconBtn
                          label="Bend up"
                          onClick={() => setLinkVariant(l.id, 'incline-up')}
                          active={l.variant === 'incline-up'}
                        >
                          <ArrowUp className="size-3" />
                        </IconBtn>
                        <IconBtn
                          label="Bend down"
                          onClick={() => setLinkVariant(l.id, 'incline-down')}
                          active={l.variant === 'incline-down'}
                        >
                          <ArrowDown className="size-3" />
                        </IconBtn>
                      </div>
                    )}
                    <IconBtn
                      label="Move up"
                      onClick={() => moveLink(l.id, i - 1)}
                      disabled={i === 0}
                    >
                      <ChevronUp className="size-3" />
                    </IconBtn>
                    <IconBtn
                      label="Move down"
                      onClick={() => moveLink(l.id, i + 1)}
                      disabled={i === links.length - 1}
                    >
                      <ChevronDown className="size-3" />
                    </IconBtn>
                    <IconBtn
                      label="Remove"
                      onClick={() => removeLink(l.id)}
                      danger
                    >
                      <Trash2 className="size-3" />
                    </IconBtn>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section title="Overall dimensions">
          <Stat label="Footprint length" value={formatMm(bom.footprintLengthMm)} />
          <Stat label="Overall height" value={formatMm(bom.heightMm)} />
          <Stat label="Belt path length" value={formatMm(bom.beltLengthMm)} />
          <Stat
            label="Belt area"
            value={`${bom.beltAreaM2.toFixed(2)} m²`}
          />
        </Section>

        <Section title="Bill of materials">
          {bom.rows.length === 0 ? (
            <p className="text-xs text-stone-500">
              BOM will populate as you build the chain.
            </p>
          ) : (
            <div className="-mx-1 overflow-hidden rounded border border-stone-200">
              <table className="w-full text-[11px] tabular-nums">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Item</th>
                    <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bom.rows.map((r) => (
                    <tr key={r.key} className="text-stone-700">
                      <td className="px-2 py-1.5">
                        <div className="font-medium text-stone-800">
                          {r.label}
                        </div>
                        {r.detail && (
                          <div className="text-[10px] text-stone-500">
                            {r.detail}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {r.qty} {r.unit}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">
                        {formatAud(r.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      <div className="border-t border-stone-200 bg-stone-50 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-stone-500">
            Subtotal
          </span>
          <span className="text-lg font-semibold tabular-nums text-stone-900">
            {formatAud(bom.subtotal)}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-stone-500">
          Indicative pricing for {conveyorWidth} mm wide conveyor.
        </div>
      </div>
    </aside>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-stone-100 px-4 py-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-stone-600">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-stone-600">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        {children}
      </select>
    </label>
  )
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-stone-700">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-orange-500"
      />
      <span>{label}</span>
    </label>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-xs">
      <span className="text-stone-500">{label}</span>
      <span className="font-mono text-[12px] font-semibold text-stone-800">
        {value}
      </span>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  active,
  danger,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  danger?: boolean
  label: string
}) {
  const cls = active
    ? 'bg-orange-500 text-white'
    : danger
      ? 'text-red-600 hover:bg-red-50'
      : 'text-stone-600 hover:bg-stone-100'
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-6 place-items-center rounded transition disabled:opacity-30 disabled:hover:bg-transparent ${cls}`}
    >
      {children}
    </button>
  )
}
