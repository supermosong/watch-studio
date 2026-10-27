import { create } from 'zustand'
import { temporal } from 'zundo'
import {
  createDefaultDesign,
  parseDesign,
  type WatchDesign,
  type WatchSection,
} from '../model/watchDesign'

const STORAGE_KEY = 'watch-design:current'

function loadSaved(): WatchDesign {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return parseDesign(JSON.parse(raw)) ?? createDefaultDesign()
  } catch {
    // Storage blocked or corrupt data: fall back to the default design.
  }
  return createDefaultDesign()
}

interface DesignState {
  design: WatchDesign
  updateSection: <K extends WatchSection>(section: K, patch: Partial<WatchDesign[K]>) => void
  rename: (name: string) => void
  replace: (design: WatchDesign) => void
}

/**
 * Records at most one undo step per burst of changes, so dragging a slider
 * or a color picker undoes in one step instead of hundreds.
 */
function coalesce<T extends (...args: never[]) => void>(fn: T, windowMs: number): T {
  let last = 0
  return ((...args) => {
    const now = Date.now()
    if (now - last > windowMs) fn(...args)
    last = now
  }) as T
}

export const useDesignStore = create<DesignState>()(
  temporal(
    (set) => ({
      design: loadSaved(),
      updateSection: (section, patch) =>
        set((s) => ({ design: { ...s.design, [section]: { ...s.design[section], ...patch } } })),
      rename: (name) => set((s) => ({ design: { ...s.design, name } })),
      replace: (design) => set({ design }),
    }),
    {
      limit: 100,
      partialize: (s) => ({ design: s.design }),
      handleSet: (handleSet) => coalesce(handleSet, 400),
    },
  ),
)

useDesignStore.subscribe((s) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s.design))
  } catch {
    // Storage unavailable (private mode, quota): the design just isn't persisted.
  }
})
