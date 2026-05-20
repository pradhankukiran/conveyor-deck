import { RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { DrawingMeta } from '../lib/store'
import { getModule, MODULES } from '../modules/registry'

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

  const modules = useStore((s) => s.modules)
  const selectedModuleId = useStore((s) => s.selectedModuleId)
  const removeSelected = useStore((s) => s.removeSelected)
  const rotateModule = useStore((s) => s.rotateModule)

  const selected = selectedModuleId
    ? modules.find((m) => m.id === selectedModuleId) ?? null
    : null
  const selectedDef = selected ? getModule(selected.kind) : null

  const handleDrawingChange =
    <K extends keyof DrawingMeta>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDrawingField(key, e.target.value as DrawingMeta[K])
    }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Properties
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Drawing">
          <TextField
            label="Title"
            value={title}
            placeholder="e.g. PACT Villawood"
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

        <Section title="Conveyor">
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

        {selected && selectedDef && (
          <Section title="Selection">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-stone-400">
                {selected.kind}
              </div>
              <div className="text-sm font-medium text-stone-900">
                {selectedDef.label}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <ActionButton
                onClick={() => rotateModule(selected.id, -15)}
                icon={<RotateCcw className="h-3.5 w-3.5" />}
                label="Rotate −15°"
              />
              <ActionButton
                onClick={() => rotateModule(selected.id, 15)}
                icon={<RotateCw className="h-3.5 w-3.5" />}
                label="Rotate +15°"
              />
              <ActionButton
                onClick={() => removeSelected()}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                label="Remove"
                tone="danger"
              />
            </div>
          </Section>
        )}

        <Section title="Bill of Materials">
          {modules.length === 0 ? (
            <p className="text-xs text-stone-500">
              BOM will populate from placed modules.
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-stone-700">
              {modules.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <span>{MODULES[m.kind].shortLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="border-t border-stone-200 bg-stone-50 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-stone-500">
            Total
          </span>
          <span className="text-lg font-semibold tabular-nums text-stone-900">
            $0.00
          </span>
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
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
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

function ActionButton({
  onClick,
  icon,
  label,
  tone = 'default',
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  tone?: 'default' | 'danger'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-stone-300 bg-white text-red-600 hover:border-red-300 hover:bg-red-50'
      : 'border-stone-300 bg-white text-stone-700 hover:border-orange-300 hover:bg-orange-50'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${toneClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
