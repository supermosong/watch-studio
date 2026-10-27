import { shade } from '../../lib/color'
import type { WatchDesign } from '../../model/watchDesign'
import { getGeometry, polar } from './geometry'

/** The ring between case and dial: a polished rim, or a smooth, fluted or dive bezel. */
export function Bezel({ design, uid }: { design: WatchDesign; uid: string }) {
  const { caseR, bezelR, dialR } = getGeometry(design)
  const { type, color, insertColor, insertColor2, markingColor } = design.bezel
  const flangeR = dialR + caseR * 0.03
  const insertR = bezelR * 0.93
  const band = insertR - flangeR
  const mid = (insertR + flangeR) / 2
  const ringColor = type === 'none' ? design.case.color : color

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bezel`} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={shade(ringColor, 0.5)} />
          <stop offset="0.5" stopColor={ringColor} />
          <stop offset="1" stopColor={shade(ringColor, -0.35)} />
        </linearGradient>
      </defs>

      {type === 'none' ? (
        <circle r={dialR + caseR * 0.06} fill={`url(#${uid}-bezel)`} stroke={shade(ringColor, -0.45)} />
      ) : (
        <circle r={bezelR} fill={`url(#${uid}-bezel)`} stroke={shade(color, -0.45)} strokeWidth={1.2} />
      )}

      {type === 'fluted' &&
        Array.from({ length: 72 }, (_, i) => {
          const a = polar(flangeR + band * 0.2, i * 5)
          const b = polar(bezelR * 0.97, i * 5)
          const c = polar(flangeR + band * 0.2, i * 5 + 2.5)
          const d = polar(bezelR * 0.97, i * 5 + 2.5)
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={shade(color, -0.35)} strokeWidth={1.6} />
              <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} stroke={shade(color, 0.45)} strokeWidth={1} />
            </g>
          )
        })}

      {type === 'dive' && (
        <g>
          <circle r={insertR} fill={insertColor} />
          {Array.from({ length: 60 }, (_, i) => {
            const deg = i * 6
            if (i === 0) {
              const [l, rgt, tip] = [polar(insertR * 0.98, -4), polar(insertR * 0.98, 4), polar(flangeR * 1.02, 0)]
              return <path key={i} d={`M ${l.x} ${l.y} L ${rgt.x} ${rgt.y} L ${tip.x} ${tip.y} Z`} fill={markingColor} />
            }
            if (i % 10 === 0) {
              const p = polar(mid, deg)
              return (
                <text
                  key={i}
                  x={p.x}
                  y={p.y}
                  transform={`rotate(${deg} ${p.x} ${p.y})`}
                  fill={markingColor}
                  fontSize={band * 0.62}
                  fontWeight={700}
                  fontFamily="'Helvetica Neue', Arial, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {i}
                </text>
              )
            }
            const [inner, width] = i % 5 === 0 ? [mid - band * 0.3, 2.5] : i < 15 ? [insertR - band * 0.3, 1] : [0, 0]
            if (!width) return null
            const a = polar(inner, deg)
            const b = polar(i % 5 === 0 ? mid + band * 0.3 : insertR * 0.985, deg)
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={markingColor} strokeWidth={width} />
          })}
        </g>
      )}

      {type === 'gmt' && (
        <g>
          {/* Two-tone 24-hour scale, colors split along the 6–18 line. */}
          {(
            [
              [insertColor, 270, 90],
              [insertColor2, 90, 270],
            ] as const
          ).map(([fill, from, to]) => {
            const [o1, o2, i1, i2] = [polar(insertR, from), polar(insertR, to), polar(flangeR, to), polar(flangeR, from)]
            return (
              <path
                key={from}
                d={`M ${o1.x} ${o1.y} A ${insertR} ${insertR} 0 0 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${flangeR} ${flangeR} 0 0 0 ${i2.x} ${i2.y} Z`}
                fill={fill}
              />
            )
          })}
          {Array.from({ length: 24 }, (_, hour) => {
            const deg = hour * 15
            if (hour === 0) {
              const [l, rgt, tip] = [polar(insertR * 0.98, -4), polar(insertR * 0.98, 4), polar(flangeR * 1.02, 0)]
              return <path key={hour} d={`M ${l.x} ${l.y} L ${rgt.x} ${rgt.y} L ${tip.x} ${tip.y} Z`} fill={markingColor} />
            }
            const p = polar(mid, deg)
            if (hour % 2 === 1) return <circle key={hour} cx={p.x} cy={p.y} r={band * 0.08} fill={markingColor} />
            return (
              <text
                key={hour}
                x={p.x}
                y={p.y}
                transform={`rotate(${deg} ${p.x} ${p.y})`}
                fill={markingColor}
                fontSize={band * 0.55}
                fontWeight={700}
                fontFamily="'Helvetica Neue', Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {hour}
              </text>
            )
          })}
        </g>
      )}

      {type !== 'none' && <circle r={flangeR} fill={shade(design.case.color, -0.2)} />}
    </g>
  )
}
