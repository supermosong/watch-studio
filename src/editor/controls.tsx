import { useId, type ReactNode } from 'react'

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-xs font-medium uppercase tracking-wider text-stone-400">
        {label}
      </label>
      {children}
    </div>
  )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-3 rounded-lg border border-stone-700 bg-stone-900 p-1.5 pr-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
        />
        <span className="font-mono text-sm text-stone-300">{value.toUpperCase()}</span>
      </div>
    </Field>
  )
}

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  labels,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T
  /** Display text per option; defaults to the option itself. */
  labels?: Partial<Record<T, string>>
  onChange: (v: T) => void
}) {
  return (
    <Field label={label}>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={opt === value}
            onClick={() => onChange(opt)}
            className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
              opt === value
                ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-500'
            }`}
          >
            {labels?.[opt] ?? opt}
          </button>
        ))}
      </div>
    </Field>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <Field label={`${label} · ${value}${unit}`} htmlFor={id}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400"
      />
    </Field>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5">
      <span className="text-sm text-stone-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-amber-400"
      />
    </label>
  )
}

export function TextField({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string
  value: string
  maxLength: number
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-400"
      />
    </Field>
  )
}
