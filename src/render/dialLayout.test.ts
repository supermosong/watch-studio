import { describe, expect, it } from 'vitest'
import { createDefaultDesign, type WatchDesign } from '../model/watchDesign'
import { SECTOR_RING, dialColorAt, dialLayout } from './dialLayout'

function withComplications(c: Partial<WatchDesign['complications']>): WatchDesign {
  const d = createDefaultDesign()
  return { ...d, complications: { ...d.complications, ...c } }
}

describe('dialLayout', () => {
  it('plain dial hides nothing', () => {
    const layout = dialLayout(withComplications({ date: 'none', chrono: 'none' }))
    expect(layout.subdials).toEqual([])
    expect(layout.date).toBeNull()
    expect([...layout.hiddenHours]).toEqual([])
  })

  it('date at 3 replaces the 3 o’clock index', () => {
    const layout = dialLayout(withComplications({ date: '3h', chrono: 'none' }))
    expect(layout.date).toEqual({ angle: 90, dist: 0.66 })
    expect([...layout.hiddenHours]).toEqual([3])
  })

  it('chronograph subdials hide the indices they cover', () => {
    const layout = dialLayout(withComplications({ date: 'none', chrono: 'tricompax' }))
    expect(layout.subdials.map((s) => s.hour)).toEqual([3, 6, 9])
    expect([...layout.hiddenHours].sort()).toEqual([3, 6, 9])
    expect(layout.subdials.find((s) => s.hour === 9)?.kind).toBe('seconds')
  })

  it('a date that would sit under a subdial moves to 4:30', () => {
    expect(dialLayout(withComplications({ date: '3h', chrono: 'bicompax' })).date?.angle).toBe(135)
    expect(dialLayout(withComplications({ date: '6h', chrono: 'tricompax' })).date?.angle).toBe(135)
    // Two subdials leave 6 o'clock free.
    expect(dialLayout(withComplications({ date: '6h', chrono: 'bicompax' })).date?.angle).toBe(180)
  })

  it('the second text line moves under the logo when a subdial sits at 6', () => {
    expect(dialLayout(withComplications({ chrono: 'none' })).subTextY).toBeGreaterThan(0)
    expect(dialLayout(withComplications({ chrono: 'bicompax' })).subTextY).toBeGreaterThan(0)
    expect(dialLayout(withComplications({ chrono: 'tricompax' })).subTextY).toBeLessThan(0)
  })
})

describe('dialColorAt', () => {
  const dial = { ...createDefaultDesign().dial, color: '#808080', color2: '#ff0000' }

  it('solid dials are one color', () => {
    expect(dialColorAt({ ...dial, tone: 'solid' }, 0.66)).toBe('#808080')
  })

  it('sector dials use the second color only on the hour ring', () => {
    const sector = { ...dial, tone: 'sector' } as const
    expect(dialColorAt(sector, 0.2)).toBe('#808080')
    expect(dialColorAt(sector, (SECTOR_RING[0] + SECTOR_RING[1]) / 2)).toBe('#ff0000')
    expect(dialColorAt(sector, 0.95)).toBe('#808080')
  })

  it('smoked dials darken toward the rim', () => {
    const smoked = { ...dial, tone: 'smoked' } as const
    expect(dialColorAt(smoked, 0.1)).toBe('#808080')
    const lum = (t: number) => parseInt(dialColorAt(smoked, t).slice(1, 3), 16)
    expect(lum(0.6)).toBeLessThan(0x80)
    expect(lum(1)).toBeLessThan(lum(0.6))
  })
})
