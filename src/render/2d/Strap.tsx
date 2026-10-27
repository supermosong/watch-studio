import { shade } from '../../lib/color'
import type { WatchDesign } from '../../model/watchDesign'
import { VIEW_H, getGeometry } from './geometry'

/** Both strap halves. Each half is drawn pointing up and mirrored for the bottom one. */
export function Strap({ design, uid }: { design: WatchDesign; uid: string }) {
  const { caseR, strapW } = getGeometry(design)
  const { type, color, accentColor } = design.strap
  const top = -VIEW_H / 2 - 10
  const end = -caseR * 0.85
  const wEnd = strapW / 2
  const wTop = strapW * 0.42
  const piece = `M ${-wEnd} ${end} L ${-wTop} ${top} L ${wTop} ${top} L ${wEnd} ${end} Z`
  const rows = (step: number, offset = 0) => {
    const ys: number[] = []
    for (let y = end - offset; y > top; y -= step) ys.push(y)
    return ys
  }

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-strap`}>
          <path d={piece} />
        </clipPath>
        <linearGradient id={`${uid}-strap-fill`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={shade(color, -0.3)} />
          <stop offset="0.2" stopColor={color} />
          <stop offset="0.5" stopColor={shade(color, 0.08)} />
          <stop offset="0.8" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -0.3)} />
        </linearGradient>
      </defs>
      {[1, -1].map((dir) => (
        <g key={dir} transform={`scale(1 ${dir})`}>
          <g clipPath={`url(#${uid}-strap)`}>
            <path d={piece} fill={`url(#${uid}-strap-fill)`} />

            {type === 'leather' &&
              [-1, 1].map((side) => (
                <line
                  key={side}
                  x1={side * (wEnd - 7)}
                  y1={end}
                  x2={side * (wTop - 7)}
                  y2={top}
                  stroke={accentColor}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
              ))}

            {type === 'rubber' &&
              rows(16, 14).map((y) => (
                <g key={y}>
                  <line x1={-wEnd} x2={wEnd} y1={y} y2={y} stroke={shade(color, -0.35)} strokeWidth={3} />
                  <line x1={-wEnd} x2={wEnd} y1={y + 2.5} y2={y + 2.5} stroke={shade(color, 0.15)} strokeWidth={1} />
                </g>
              ))}

            {type === 'metal' && (
              <>
                <rect x={-strapW * 0.17} y={top} width={strapW * 0.34} height={end - top} fill={accentColor} />
                {[-1, 1].map((side) => (
                  <line
                    key={side}
                    x1={side * strapW * 0.17}
                    x2={side * strapW * 0.17}
                    y1={top}
                    y2={end}
                    stroke={shade(color, -0.45)}
                    strokeWidth={1.5}
                  />
                ))}
                {rows(26).map((y) => (
                  <g key={y} stroke={shade(color, -0.45)} strokeWidth={1.5}>
                    <line x1={-wEnd} x2={-strapW * 0.17} y1={y} y2={y} />
                    <line x1={strapW * 0.17} x2={wEnd} y1={y} y2={y} />
                    <line x1={-strapW * 0.17} x2={strapW * 0.17} y1={y - 13} y2={y - 13} />
                  </g>
                ))}
              </>
            )}

            {type === 'nato' && (
              <>
                {[-1, 1].map((side) => (
                  <rect
                    key={side}
                    x={side * strapW * 0.22 - strapW * 0.045}
                    y={top}
                    width={strapW * 0.09}
                    height={end - top}
                    fill={accentColor}
                  />
                ))}
                <line
                  x1={-wEnd}
                  x2={wEnd}
                  y1={end - 30}
                  y2={end - 30}
                  stroke={shade(color, -0.35)}
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                />
              </>
            )}

            {dir === -1 &&
              (type === 'leather' || type === 'rubber') &&
              [0, 1, 2, 3].map((i) => <circle key={i} cx={0} cy={end - 120 - i * 22} r={3.5} fill={shade(color, -0.6)} />)}
          </g>
        </g>
      ))}
    </g>
  )
}
