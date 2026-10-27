import { useId, type Ref } from 'react'
import type { WatchDesign } from '../../model/watchDesign'
import { Bezel } from './Bezel'
import { Case } from './Case'
import { Dial } from './Dial'
import { Hands } from './Hands'
import { Strap } from './Strap'
import { VIEW_H, VIEW_W, getGeometry } from './geometry'

interface Props {
  design: WatchDesign
  time: Date
  ref?: Ref<SVGSVGElement>
  className?: string
}

/** Front view of a watch, drawn in layers from back (strap) to front (crystal glare). */
export function WatchSvg({ design, time, ref, className }: Props) {
  // Prefix for gradient/clip ids so several watches can share one page.
  const uid = 'w' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const { caseR, dialR } = getGeometry(design)

  return (
    <svg
      ref={ref}
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${design.name} watch preview`}
    >
      <defs>
        <clipPath id={`${uid}-crystal`}>
          <circle r={dialR + caseR * 0.03} />
        </clipPath>
        <linearGradient id={`${uid}-glare`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`translate(${VIEW_W / 2} ${VIEW_H / 2})`}>
        <Strap design={design} uid={uid} />
        <Case design={design} uid={uid} />
        <Bezel design={design} uid={uid} />
        <Dial design={design} uid={uid} />
        <Hands design={design} uid={uid} time={time} />
        <g clipPath={`url(#${uid}-crystal)`} pointerEvents="none">
          <ellipse
            cx={-dialR * 0.35}
            cy={-dialR * 0.55}
            rx={dialR * 1.1}
            ry={dialR * 0.55}
            transform={`rotate(-30 ${-dialR * 0.35} ${-dialR * 0.55})`}
            fill={`url(#${uid}-glare)`}
          />
        </g>
      </g>
    </svg>
  )
}
