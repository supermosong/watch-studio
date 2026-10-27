import { Suspense, lazy, useEffect, useRef, useState, type Ref } from 'react'
import { useStore } from 'zustand'
import { exportCanvasPng, exportPng, exportSvg } from '../lib/export'
import { PRESETS, presetDesign, randomDesign } from '../model/presets'
import type { WatchDesign } from '../model/watchDesign'
import { WatchSvg } from '../render/2d/WatchSvg'
import { useClock } from '../render/2d/useClock'
import { useDesignStore } from '../store/designStore'
import { PANELS } from './panels'

// three.js is large, so the 3D view loads on demand.
const Watch3D = lazy(() => import('../render/3d/Watch3D'))

const button =
  'rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-stone-200 transition-colors hover:border-stone-500 disabled:opacity-40 disabled:hover:border-stone-700'

type View = '3d' | '2d'
const VIEW_KEY = 'watch-design:view'

function useViewMode() {
  const [view, setView] = useState<View>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === '2d' ? '2d' : '3d'
    } catch {
      return '3d'
    }
  })
  const choose = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // Not remembered; harmless.
    }
  }
  return [view, choose] as const
}

/** The 2D view owns its clock so the rest of the editor doesn't re-render every second. */
function LiveWatchSvg({ design, svgRef }: { design: WatchDesign; svgRef: Ref<SVGSVGElement> }) {
  const time = useClock()
  return <WatchSvg ref={svgRef} design={design} time={time} className="h-[70vh] max-h-full w-auto lg:h-full" />
}

function useUndoShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      // Leave text fields to their own native undo.
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return
      e.preventDefault()
      const { undo, redo } = useDesignStore.temporal.getState()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export function EditorLayout() {
  const design = useDesignStore((s) => s.design)
  const rename = useDesignStore((s) => s.rename)
  const replace = useDesignStore((s) => s.replace)
  const { undo, redo } = useDesignStore.temporal.getState()
  const canUndo = useStore(useDesignStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useDesignStore.temporal, (s) => s.futureStates.length > 0)
  const [tab, setTab] = useState(PANELS[0].id)
  const [exportError, setExportError] = useState<string | null>(null)
  const [view, setView] = useViewMode()
  const [night, setNight] = useState(false)
  const [spin, setSpin] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useUndoShortcuts()

  const { Panel } = PANELS.find((p) => p.id === tab) ?? PANELS[0]

  const onExportPng = async () => {
    setExportError(null)
    try {
      if (view === '3d' && canvasRef.current) await exportCanvasPng(canvasRef.current, design.name)
      else if (view === '2d' && svgRef.current) await exportPng(svgRef.current, design.name)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-950 text-stone-100 lg:h-dvh">
      <header className="flex flex-wrap items-center gap-3 border-b border-stone-800 px-4 py-3">
        <h1 className="mr-2 font-serif text-lg tracking-wide text-amber-200">Watch Studio</h1>
        <input
          aria-label="Design name"
          value={design.name}
          maxLength={60}
          onChange={(e) => rename(e.target.value)}
          className="w-40 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
        />
        <select
          aria-label="Start from a preset"
          value=""
          onChange={(e) => e.target.value && replace(presetDesign(e.target.value))}
          className={button}
        >
          <option value="">Presets…</option>
          {Object.keys(PRESETS).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="button" className={button} onClick={() => replace(randomDesign())}>
          Randomize
        </button>
        <div className="flex gap-1.5">
          <button type="button" className={button} onClick={() => undo()} disabled={!canUndo} title="Undo (⌘Z)">
            Undo
          </button>
          <button type="button" className={button} onClick={() => redo()} disabled={!canRedo} title="Redo (⇧⌘Z)">
            Redo
          </button>
        </div>
        <div className="ml-auto flex gap-1.5">
          {view === '2d' && (
            <button type="button" className={button} onClick={() => svgRef.current && exportSvg(svgRef.current, design.name)}>
              Export SVG
            </button>
          )}
          <button
            type="button"
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-medium text-stone-950 hover:bg-amber-300"
            onClick={onExportPng}
          >
            Export PNG
          </button>
        </div>
        {exportError && <p className="w-full text-sm text-red-400">{exportError}</p>}
      </header>

      <main className="grid flex-1 lg:min-h-0 lg:grid-cols-[1fr_380px]">
        <section
          className={`relative flex h-[70vh] items-center justify-center transition-colors lg:h-auto lg:min-h-0 ${
            night && view === '3d' ? 'bg-black' : 'bg-[radial-gradient(circle_at_center,#3a3530_0%,#0c0a09_70%)]'
          }`}
        >
          <div role="radiogroup" aria-label="Preview mode" className="absolute left-4 top-4 z-10 flex rounded-lg border border-stone-700 bg-stone-900/80 p-0.5">
            {(['3d', '2d'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-sm uppercase ${view === v ? 'bg-stone-700 text-amber-200' : 'text-stone-400 hover:text-stone-200'}`}
              >
                {v}
              </button>
            ))}
          </div>
          {view === '3d' && (
            <div className="absolute right-4 top-4 z-10 flex gap-1.5">
              <button
                type="button"
                aria-pressed={spin}
                onClick={() => setSpin(!spin)}
                title="Spin the watch slowly; turn it off to stop at the angle you like"
                className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                  spin
                    ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                    : 'border-stone-700 bg-stone-900/80 text-stone-400 hover:text-stone-200'
                }`}
              >
                ⟳ Turntable
              </button>
              <button
                type="button"
                aria-pressed={night}
                onClick={() => setNight(!night)}
                title="Turn the lights off to see the lume glow"
                className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                  night
                    ? 'border-emerald-300/60 bg-emerald-300/15 text-emerald-200'
                    : 'border-stone-700 bg-stone-900/80 text-stone-400 hover:text-stone-200'
                }`}
              >
                ☾ Lume
              </button>
            </div>
          )}
          {view === '3d' ? (
            <Suspense fallback={<p className="text-sm text-stone-400">Loading 3D studio…</p>}>
              <Watch3D ref={canvasRef} design={design} night={night} spin={spin} />
              <p className="pointer-events-none absolute bottom-3 text-xs text-stone-500">Drag to rotate · scroll to zoom</p>
            </Suspense>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6">
              <LiveWatchSvg design={design} svgRef={svgRef} />
            </div>
          )}
        </section>

        <aside className="flex flex-col border-t border-stone-800 bg-stone-950 lg:min-h-0 lg:border-l lg:border-t-0">
          <nav role="tablist" aria-label="Watch elements" className="flex flex-wrap gap-1 border-b border-stone-800 p-3">
            {PANELS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === tab}
                onClick={() => setTab(p.id)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  p.id === tab ? 'bg-stone-800 text-amber-200' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
          <div role="tabpanel" className="space-y-5 overflow-y-auto p-4">
            <Panel />
          </div>
        </aside>
      </main>
    </div>
  )
}
