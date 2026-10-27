import { describe, expect, it } from 'vitest'
import { dialText } from './typography'

describe('dialText', () => {
  it('leaves non-script text as typed', () => {
    expect(dialText('sans', 'AUTOMATIC')).toBe('AUTOMATIC')
  })

  it('turns all-caps words into Title Case in script, keeping short codes and mixed case', () => {
    expect(dialText('script', 'AUTOMATIC')).toBe('Automatic')
    expect(dialText('script', 'ÉLÉGANCE')).toBe('Élégance')
    expect(dialText('script', 'GMT MASTER')).toBe('GMT Master')
    expect(dialText('script', '200m')).toBe('200m')
    expect(dialText('script', 'Seamaster')).toBe('Seamaster')
  })
})
