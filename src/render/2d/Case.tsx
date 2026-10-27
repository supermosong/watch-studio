import type { SVGProps } from 'react'
import { shade } from '../../lib/color'
import type { WatchDesign } from '../../model/watchDesign'
import { getGeometry, polar } from './geometry'

const CROWN_SIZE = { small: [0.08, 0.16], medium: [0.1, 0.2], large: [0.13, 0.26] } as const

function CaseShape({ shape, r, ...props }: { shape: WatchDesign['case']['shape']; r: number } & SVGProps<SVGElement>) {
  switch (shape) {
    case 'round':
      return <circle r={r} {...(props as SVGProps<SVGCircleElement>)} />
    case 'cushion':
      return <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={r * 0.45} {...(props as SVGProps<SVGRectElement>)} />
    case 'square':
      return <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={r * 0.18} {...(props as SVGProps<SVGRectElement>)} />
    case 'tonneau': {
      const [w, h, bulge, dome] = [0.82 * r, 1.08 * r, 1.12 * r, 1.18 * r]
      const d = `M ${-w} ${-h} Q 0 ${-dome} ${w} ${-h} Q ${bulge} 0 ${w} ${h} Q 0 ${dome} ${-w} ${h} Q ${-bulge} 0 ${-w} ${-h} Z`
      return <path d={d} {...(props as SVGProps<SVGPathElement>)} />
    }
  }
}

/** Lugs, crown and the case body. */
export function Case({ design, uid }: { design: WatchDesign; uid: string }) {
  const { caseR: r, strapW, edgeX } = getGeometry(design)
  const { shape, color, finish } = design.case
  const metal = `url(#${uid}-case)`
  const outline = shade(color, -0.45)
  const [cw, ch] = CROWN_SIZE[design.crown.size].map((k) => k * r)
  // Polished metal swings from bright to dark; brushed and matte are flatter.
  const [hi, lo] = { polished: [0.45, -0.3], brushed: [0.25, -0.2], matte: [0.1, -0.1] }[finish]

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(color, hi)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, lo)} />
        </linearGradient>
      </defs>

      {design.complications.chrono !== 'none' &&
        [-1, 1].map((sy) => {
          // 2 and 4 o'clock: radial on round cases, horizontal on flat-sided ones.
          const angle = shape === 'round' ? 90 + sy * 30 : 90
          const base = shape === 'round' ? polar(r, angle) : { x: edgeX, y: sy * r * 0.5 }
          return (
            <g key={sy} transform={`translate(${base.x} ${base.y}) rotate(${angle - 90})`}>
              <rect x={-4} y={-r * 0.045} width={r * 0.1} height={r * 0.09} fill={metal} stroke={outline} />
              <rect x={r * 0.08} y={-r * 0.075} width={r * 0.07} height={r * 0.15} rx={r * 0.02} fill={metal} stroke={outline} />
            </g>
          )
        })}

      {shape !== 'tonneau' &&
        [-1, 1].flatMap((sx) =>
          [-1, 1].map((sy) => (
            <rect
              key={`${sx}${sy}`}
              x={sx > 0 ? strapW / 2 + 1 : -strapW / 2 - 1 - r * 0.14}
              y={sy > 0 ? r * 0.62 : -r * 1.22}
              width={r * 0.14}
              height={r * 0.6}
              rx={r * 0.05}
              fill={metal}
              stroke={outline}
            />
          )),
        )}

      {design.crown.guards &&
        [-1, 1].map((sy) => (
          <rect
            key={sy}
            x={edgeX - 8}
            y={sy > 0 ? ch / 2 + 2 : -ch / 2 - 2 - ch * 0.4}
            width={cw * 0.9 + 8}
            height={ch * 0.4}
            rx={ch * 0.15}
            fill={metal}
            stroke={outline}
          />
        ))}

      <rect x={edgeX - 4} y={-ch * 0.25} width={8} height={ch * 0.5} fill={shade(color, -0.2)} />
      <rect x={edgeX + 2} y={-ch / 2} width={cw} height={ch} rx={cw * 0.25} fill={metal} stroke={outline} />
      {Array.from({ length: 6 }, (_, i) => {
        const y = -ch / 2 + ((i + 1) * ch) / 7
        return (
          <line
            key={i}
            x1={edgeX + 2 + cw * 0.15}
            x2={edgeX + 2 + cw * 0.95}
            y1={y}
            y2={y}
            stroke={outline}
            strokeWidth={0.8}
          />
        )
      })}

      <CaseShape shape={shape} r={r} fill={metal} stroke={outline} strokeWidth={1.5} />
    </g>
  )
}
