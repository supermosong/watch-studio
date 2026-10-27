import { describe, expect, it } from 'vitest'
import { luminance, shade } from '../lib/color'
import { PRESETS, presetDesign, randomDesign } from './presets'
import { createDefaultDesign, parseDesign } from './watchDesign'

describe('watch design model', () => {
  it('default design is valid', () => {
    expect(parseDesign(createDefaultDesign())).not.toBeNull()
  })

  it('every preset is valid', () => {
    for (const name of Object.keys(PRESETS)) {
      expect(parseDesign(presetDesign(name)), name).not.toBeNull()
    }
  })

  it('random designs are always valid', () => {
    for (let i = 0; i < 200; i++) {
      expect(parseDesign(randomDesign())).not.toBeNull()
    }
  })

  it('rejects malformed data', () => {
    const bad = { ...createDefaultDesign(), dial: { color: 'red', logoText: '', logoColor: '#ffffff' } }
    expect(parseDesign(bad)).toBeNull()
    expect(parseDesign({ ...createDefaultDesign(), case: { shape: 'round', diameter: 99, color: '#ffffff' } })).toBeNull()
    expect(parseDesign(null)).toBeNull()
  })

  it('designs saved before finishes and complications existed still load, with defaults', () => {
    const { complications: _c, ...older } = createDefaultDesign()
    const legacy = {
      ...older,
      case: { shape: 'round', diameter: 40, color: '#c9ccd1' },
      dial: { color: '#1f3a5f', logoText: 'OLD', logoColor: '#f4f4f4' },
    }
    const parsed = parseDesign(legacy)
    expect(parsed?.case.finish).toBe('polished')
    expect(parsed?.dial.finish).toBe('sunburst')
    expect(parsed?.complications).toEqual({
      date: 'none',
      chrono: 'none',
      subdialColor: '#1a1a1a',
      cyclops: false,
      gmt: false,
      gmtColor: '#d6402b',
    })
  })

  it('designs saved before GMT, cyclops and hand lume existed still load, with defaults', () => {
    const d = createDefaultDesign()
    const legacy = {
      ...d,
      bezel: { type: 'dive', color: '#c9ccd1', insertColor: '#111111', markingColor: '#f4f4f4' },
      complications: { date: '3h', chrono: 'none', subdialColor: '#1a1a1a' },
      hands: { style: 'sword', color: '#f4f4f4', secondsColor: '#e0452b' },
    }
    const parsed = parseDesign(legacy)
    expect(parsed?.bezel.insertColor2).toBe('#1a1a1a')
    expect(parsed?.complications).toMatchObject({ date: '3h', cyclops: false, gmt: false })
    expect(parsed?.hands.lume).toBe(false)
  })

  it('designs saved before dial tones, fonts and the second text line existed still load, with defaults', () => {
    const d = createDefaultDesign()
    const parsed = parseDesign({ ...d, dial: { color: '#1f3a5f', finish: 'plain', logoText: 'OLD', logoColor: '#f4f4f4' } })
    expect(parsed?.dial).toMatchObject({ tone: 'solid', font: 'sans', subText: '', logoText: 'OLD' })
  })

  it('preset designs get fresh ids and do not share state', () => {
    const a = presetDesign('Diver')
    const b = presetDesign('Diver')
    expect(a.id).not.toBe(b.id)
    a.dial.color = '#000000'
    expect(b.dial.color).toBe(PRESETS.Diver.dial.color)
  })
})

describe('color helpers', () => {
  it('shade lightens and darkens', () => {
    expect(shade('#808080', 1)).toBe('#ffffff')
    expect(shade('#808080', -1)).toBe('#000000')
    expect(shade('#808080', 0)).toBe('#808080')
  })

  it('luminance orders black below white', () => {
    expect(luminance('#000000')).toBe(0)
    expect(luminance('#ffffff')).toBeCloseTo(1)
  })
})
