import type { ComponentType } from 'react'
import {
  BEZEL_TYPES,
  CASE_FINISHES,
  CASE_SHAPES,
  CHRONO_LAYOUTS,
  CROWN_SIZES,
  DATE_POSITIONS,
  DIAL_FINISHES,
  DIAL_FONTS,
  DIAL_TONES,
  DIAMETER_MAX,
  DIAMETER_MIN,
  HAND_STYLES,
  INDEX_TYPES,
  METALS,
  STRAP_TYPES,
  type WatchSection,
} from '../model/watchDesign'
import { dialTextStyle } from '../render/typography'
import { useDesignStore } from '../store/designStore'
import { ColorField, OptionGroup, Slider, TextField, Toggle } from './controls'

/** Current values and an updater for one section of the design. */
function useSection<K extends WatchSection>(section: K) {
  const value = useDesignStore((s) => s.design[section])
  const updateSection = useDesignStore((s) => s.updateSection)
  return [value, (patch: Partial<typeof value>) => updateSection(section, patch)] as const
}

function CasePanel() {
  const [c, set] = useSection('case')
  return (
    <>
      <OptionGroup label="Shape" options={CASE_SHAPES} value={c.shape} onChange={(shape) => set({ shape })} />
      <Slider
        label="Diameter"
        unit=" mm"
        min={DIAMETER_MIN}
        max={DIAMETER_MAX}
        value={c.diameter}
        onChange={(diameter) => set({ diameter })}
      />
      <ColorField label="Metal" value={c.color} swatches={METALS} onChange={(color) => set({ color })} />
      <OptionGroup label="Finish" options={CASE_FINISHES} value={c.finish} onChange={(finish) => set({ finish })} />
    </>
  )
}

function BezelPanel() {
  const [b, set] = useSection('bezel')
  return (
    <>
      <OptionGroup
        label="Type"
        options={BEZEL_TYPES}
        value={b.type}
        labels={{ gmt: 'GMT 24h' }}
        onChange={(type) => set({ type })}
      />
      {b.type !== 'none' && (
        <ColorField label="Bezel metal" value={b.color} swatches={METALS} onChange={(color) => set({ color })} />
      )}
      {(b.type === 'dive' || b.type === 'gmt') && (
        <>
          <ColorField
            label={b.type === 'gmt' ? 'Insert, top half' : 'Insert'}
            value={b.insertColor}
            onChange={(insertColor) => set({ insertColor })}
          />
          {b.type === 'gmt' && (
            <ColorField label="Insert, bottom half" value={b.insertColor2} onChange={(insertColor2) => set({ insertColor2 })} />
          )}
          <ColorField label="Markings" value={b.markingColor} onChange={(markingColor) => set({ markingColor })} />
        </>
      )}
    </>
  )
}

function CrownPanel() {
  const [c, set] = useSection('crown')
  return (
    <>
      <OptionGroup label="Size" options={CROWN_SIZES} value={c.size} onChange={(size) => set({ size })} />
      <Toggle label="Crown guards" checked={c.guards} onChange={(guards) => set({ guards })} />
    </>
  )
}

// Each font option is shown in its own typeface.
const FONT_PREVIEW = Object.fromEntries(DIAL_FONTS.map((f) => [f, { fontFamily: dialTextStyle(f, 1, 'logo').family }]))

function DialPanel() {
  const [d, set] = useSection('dial')
  return (
    <>
      <ColorField label="Dial color" value={d.color} onChange={(color) => set({ color })} />
      <OptionGroup label="Finish" options={DIAL_FINISHES} value={d.finish} onChange={(finish) => set({ finish })} />
      <OptionGroup
        label="Color style"
        options={DIAL_TONES}
        value={d.tone}
        labels={{ sector: 'Sector (two-tone)' }}
        onChange={(tone) => set({ tone })}
      />
      {d.tone === 'sector' && <ColorField label="Hour ring color" value={d.color2} onChange={(color2) => set({ color2 })} />}
      <TextField label="Logo text" maxLength={16} value={d.logoText} onChange={(logoText) => set({ logoText })} />
      <TextField
        label="Second line"
        maxLength={20}
        placeholder="e.g. AUTOMATIC or 200m"
        value={d.subText}
        onChange={(subText) => set({ subText })}
      />
      <OptionGroup label="Font" options={DIAL_FONTS} value={d.font} styles={FONT_PREVIEW} onChange={(font) => set({ font })} />
      <ColorField label="Text color" value={d.logoColor} onChange={(logoColor) => set({ logoColor })} />
    </>
  )
}

function IndicesPanel() {
  const [i, set] = useSection('indices')
  return (
    <>
      <OptionGroup label="Style" options={INDEX_TYPES} value={i.type} onChange={(type) => set({ type })} />
      <ColorField label="Color" value={i.color} onChange={(color) => set({ color })} />
      <Toggle label="Minute track" checked={i.minuteTrack} onChange={(minuteTrack) => set({ minuteTrack })} />
    </>
  )
}

function HandsPanel() {
  const [h, set] = useSection('hands')
  return (
    <>
      <OptionGroup label="Style" options={HAND_STYLES} value={h.style} onChange={(style) => set({ style })} />
      <ColorField label="Hour & minute" value={h.color} onChange={(color) => set({ color })} />
      <ColorField label="Seconds" value={h.secondsColor} onChange={(secondsColor) => set({ secondsColor })} />
      {h.style !== 'dauphine' && (
        <Toggle label="Lume inserts (glow at night)" checked={h.lume} onChange={(lume) => set({ lume })} />
      )}
    </>
  )
}

function ComplicationsPanel() {
  const [c, set] = useSection('complications')
  return (
    <>
      <OptionGroup
        label="Date window"
        options={DATE_POSITIONS}
        value={c.date}
        labels={{ '3h': '3 o’clock', '6h': '6 o’clock' }}
        onChange={(date) => set({ date })}
      />
      {c.date !== 'none' && (
        <Toggle label="Date magnifier (cyclops)" checked={c.cyclops} onChange={(cyclops) => set({ cyclops })} />
      )}
      <OptionGroup
        label="Chronograph"
        options={CHRONO_LAYOUTS}
        value={c.chrono}
        labels={{ bicompax: '2 subdials', tricompax: '3 subdials' }}
        onChange={(chrono) => set({ chrono })}
      />
      {c.chrono !== 'none' && (
        <ColorField label="Subdial color" value={c.subdialColor} onChange={(subdialColor) => set({ subdialColor })} />
      )}
      <Toggle label="GMT hand (second time zone)" checked={c.gmt} onChange={(gmt) => set({ gmt })} />
      {c.gmt && <ColorField label="GMT hand color" value={c.gmtColor} onChange={(gmtColor) => set({ gmtColor })} />}
    </>
  )
}

function StrapPanel() {
  const [s, set] = useSection('strap')
  const accentLabel = { leather: 'Stitching', rubber: 'Accent', metal: 'Center links', nato: 'Stripes' }[s.type]
  const metal = s.type === 'metal'
  return (
    <>
      <OptionGroup label="Type" options={STRAP_TYPES} value={s.type} onChange={(type) => set({ type })} />
      <ColorField label="Color" value={s.color} swatches={metal ? METALS : undefined} onChange={(color) => set({ color })} />
      {s.type !== 'rubber' && (
        <ColorField
          label={accentLabel}
          value={s.accentColor}
          swatches={metal ? METALS : undefined}
          onChange={(accentColor) => set({ accentColor })}
        />
      )}
    </>
  )
}

export const PANELS: { id: WatchSection; label: string; Panel: ComponentType }[] = [
  { id: 'case', label: 'Case', Panel: CasePanel },
  { id: 'bezel', label: 'Bezel', Panel: BezelPanel },
  { id: 'crown', label: 'Crown', Panel: CrownPanel },
  { id: 'dial', label: 'Dial', Panel: DialPanel },
  { id: 'indices', label: 'Indices', Panel: IndicesPanel },
  { id: 'hands', label: 'Hands', Panel: HandsPanel },
  { id: 'complications', label: 'Complications', Panel: ComplicationsPanel },
  { id: 'strap', label: 'Strap', Panel: StrapPanel },
]
