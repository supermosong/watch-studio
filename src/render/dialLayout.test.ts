import { describe, expect, it } from 'vitest'
import { createDefaultDesign, type WatchDesign } from '../model/watchDesign'
import { dialLayout } from './dialLayout'

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
})
