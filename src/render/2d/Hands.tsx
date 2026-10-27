import { shade } from '../../lib/color'
import type { WatchDesign } from '../../model/watchDesign'
import { SUBDIAL_DIST, SUBDIAL_R, dialLayout } from '../dialLayout'
import { contrastInk } from '../dialPrint'
import { getGeometry, polar } from './geometry'

type Style = WatchDesign['hands']['style']

/** A hand pointing to 12 o'clock, pivoting on (0, 0). */
function Hand({ style, length: l, width: w, color }: { style: Style; length: number; width: number; color: string }) {
  const stroke = { stroke: shade(color, -0.45), strokeWidth: 0.8 }
  switch (style) {
    case 'baton':
      return <rect x={-w / 2} y={-l} width={w} height={l * 1.12} rx={w * 0.2} fill={color} {...stroke} />
    case 'sword':
      return (
        <path
          d={`M ${-w * 0.3} ${l * 0.1} L ${-w * 0.55} ${-l * 0.72} L 0 ${-l} L ${w * 0.55} ${-l * 0.72} L ${w * 0.3} ${l * 0.1} Z`}
          fill={color}
          {...stroke}
        />
      )
    case 'dauphine':
      // Two facets, one lit and one shaded, like a real faceted hand.
      return (
        <g {...stroke}>
          <path d={`M 0 ${l * 0.1} L ${-w * 0.6} 0 L 0 ${-l} Z`} fill={shade(color, 0.25)} />
          <path d={`M 0 ${l * 0.1} L ${w * 0.6} 0 L 0 ${-l} Z`} fill={shade(color, -0.15)} />
        </g>
      )
  }
}

export function Hands({ design, uid, time }: { design: WatchDesign; uid: string; time: Date }) {
  const { dialR: r } = getGeometry(design)
  const { style, color, secondsColor } = design.hands
  const s = time.getSeconds()
  const m = time.getMinutes() + s / 60
  const h = (time.getHours() % 12) + m / 60
  // On a chronograph the center seconds is the (reset) stopwatch hand; the subdial at 9 runs.
  const { subdials } = dialLayout(design)
  const sr = r * SUBDIAL_R
  const subInk = contrastInk(design.complications.subdialColor)

  return (
    <g filter={`url(#${uid}-hand-shadow)`}>
      <defs>
        <filter id={`${uid}-hand-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1.5" dy="2.5" stdDeviation="1.8" floodOpacity="0.35" />
        </filter>
      </defs>
      {subdials.map((sub) => {
        const c = polar(r * SUBDIAL_DIST, sub.hour * 30)
        return (
          <g key={sub.hour} transform={`translate(${c.x} ${c.y}) rotate(${sub.kind === 'seconds' ? s * 6 : 0})`} fill={subInk}>
            <rect x={-r * 0.008} y={-sr * 0.76} width={r * 0.016} height={sr * 0.88} />
            <circle r={r * 0.02} />
          </g>
        )
      })}
      <g transform={`rotate(${h * 30})`}>
        <Hand style={style} length={r * 0.52} width={r * 0.075} color={color} />
      </g>
      <g transform={`rotate(${m * 6})`}>
        <Hand style={style} length={r * 0.82} width={r * 0.055} color={color} />
      </g>
      <g transform={`rotate(${subdials.length ? 0 : s * 6})`} fill={secondsColor}>
        <rect x={-r * 0.006} y={-r * 0.9} width={r * 0.012} height={r * 1.12} />
        <circle cy={r * 0.15} r={r * 0.035} />
      </g>
      <circle r={r * 0.04} fill={secondsColor} stroke={shade(secondsColor, -0.4)} strokeWidth={0.8} />
    </g>
  )
}
