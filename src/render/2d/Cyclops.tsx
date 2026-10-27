import { shade } from '../../lib/color'
import type { WatchDesign } from '../../model/watchDesign'
import { SANS } from '../typography'
import { DATE_H, DATE_W, dialLayout } from '../dialLayout'
import { getGeometry, polar } from './geometry'

const MAGNIFY = 2.1

/** The date magnifier on the crystal: the window and its frame, enlarged under a glass pane. */
export function Cyclops({ design, day }: { design: WatchDesign; day: number }) {
  const { date } = dialLayout(design)
  if (!design.complications.cyclops || !date) return null
  const { dialR: r } = getGeometry(design)
  const c = polar(r * date.dist, date.angle)
  const [w, h] = [r * DATE_W * MAGNIFY, r * DATE_H * MAGNIFY]
  const [ww, wh] = [w * 0.8, h * 0.78]

  return (
    <g transform={`translate(${c.x} ${c.y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.18} fill={shade(design.dial.color, -0.1)} />
      <rect x={-w * 0.46} y={-h * 0.46} width={w * 0.92} height={h * 0.92} fill={shade(design.case.color, -0.1)} />
      <rect x={-ww / 2} y={-wh / 2} width={ww} height={wh} fill="#f4f2ec" />
      <text
        y={wh * 0.04}
        fill="#151515"
        fontSize={wh * 0.78}
        fontWeight={700}
        fontFamily={SANS}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {day}
      </text>
      {/* The lens itself: a faint sheen and a bright rim. */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={h * 0.18}
        fill="#ffffff"
        fillOpacity={0.08}
        stroke="#ffffff"
        strokeOpacity={0.55}
        strokeWidth={1.2}
      />
    </g>
  )
}
