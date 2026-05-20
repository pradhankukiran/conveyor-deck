export function PropertiesPanel() {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Properties
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Drawing">
          <Field label="Title" placeholder="e.g. PACT Villawood" />
          <Field label="Customer" placeholder="Customer name" />
          <Field label="Drawing No." placeholder="DWG211614" />
        </Section>

        <Section title="Conveyor">
          <Field label="Width" value="600 mm" disabled />
          <Field label="Belt" placeholder="Select belt type" />
          <Field label="Motor" placeholder="Select motor" />
          <Field label="Gearbox" placeholder="Select gearbox" />
          <Field label="Control" placeholder="Select control" />
        </Section>

        <Section title="Bill of Materials">
          <p className="px-1 text-xs text-stone-500">
            Drop modules onto the canvas to populate the BOM.
          </p>
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

function Field({
  label,
  placeholder,
  value,
  disabled,
}: {
  label: string
  placeholder?: string
  value?: string
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-stone-600">{label}</span>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-stone-100 disabled:text-stone-500"
      />
    </label>
  )
}
