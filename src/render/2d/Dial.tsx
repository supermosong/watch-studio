import { useMemo } from 'react'
import { shade } from '../../lib/color'
import type { WatchDesign } from '../../model/watchDesign'
import { SECTOR_RING, dialLayout } from '../dialLayout'
import { paintDial } from '../dialPrint'
import { ROMAN, SANS, SERIF, dialText, dialTextStyle } from '../typography'
import { getGeometry, polar } from './geometry'

/**
 * Dial disc, minute track, hour indices and lettering. The finish, subdials and date
 * window are painted to a bitmap (shared with the 3D view); the rest stays vector.
 */
export function Dial({ design, uid }: { design: WatchDesign; uid: string }) {
  const { dialR: r } = getGeometry(design)
  const { color, finish, tone, color2, logoText, logoColor, font, subText } = design.dial
  const { type, color: ink, minuteTrack } = design.indices
  const { date, chrono, subdialColor } = design.complications
  const edge = shade(color, -0.4)
  const { hiddenHours, subTextY } = dialLayout(design)
  const background = useMemo(
    () => paintDial(design, 1024, { print: false }).toDataURL('image/png'),
    // Only what the bitmap paints.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, finish, tone, color2, date, chrono, subdialColor],
  )

  const hourIndex = (i: number) => {
    const deg = i * 30
    if (hiddenHours.has(i)) return null
    switch (type) {
      case 'none':
        return null
      case 'baton': {
        const w = r * 0.045
        const offsets = i === 0 ? [-w * 0.9, w * 0.9] : [0]
        return (
          <g key={i} transform={`rotate(${deg})`}>
            {offsets.map((dx) => (
              <rect key={dx} x={dx - w / 2} y={-r * 0.9} width={w} height={r * 0.17} fill={ink} stroke={edge} strokeWidth={0.6} />
            ))}
          </g>
        )
      }
      case 'dots': {
        const s = r * 0.07
        return (
          <g key={i} transform={`rotate(${deg})`} fill={ink} stroke={edge} strokeWidth={0.6}>
            {i === 0 ? (
              <path d={`M ${-s} ${-r * 0.9} L ${s} ${-r * 0.9} L 0 ${-r * 0.72} Z`} />
            ) : i % 3 === 0 ? (
              <rect x={-r * 0.03} y={-r * 0.9} width={r * 0.06} height={r * 0.18} />
            ) : (
              <circle cy={-r * 0.82} r={r * 0.055} />
            )}
          </g>
        )
      }
      case 'arabic':
      case 'roman': {
        const p = polar(r * (type === 'arabic' ? 0.72 : 0.76), deg)
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            fill={ink}
            fontSize={r * (type === 'arabic' ? 0.17 : 0.12)}
            fontFamily={type === 'arabic' ? SANS : SERIF}
            fontWeight={type === 'arabic' ? 600 : 400}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {type === 'arabic' ? String(i === 0 ? 12 : i) : ROMAN[i]}
          </text>
        )
      }
    }
  }

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-dial`}>
          <circle r={r} />
        </clipPath>
      </defs>
      <image href={background} x={-r} y={-r} width={2 * r} height={2 * r} clipPath={`url(#${uid}-dial)`} />

      {minuteTrack &&
        Array.from({ length: 60 }, (_, i) => {
          const a = polar(r * (i % 5 === 0 ? 0.92 : 0.94), i * 6)
          const b = polar(r * 0.975, i * 6)
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ink} strokeOpacity={0.75} strokeWidth={i % 5 === 0 ? 2 : 1} />
          )
        })}

      {tone === 'sector' &&
        SECTOR_RING.map((t) => <circle key={t} r={r * t} fill="none" stroke={ink} strokeOpacity={0.75} strokeWidth={1} />)}

      {Array.from({ length: 12 }, (_, i) => hourIndex(i))}

      {(
        [
          { text: logoText, line: 'logo', y: -0.4 },
          { text: subText, line: 'sub', y: subTextY },
        ] as const
      ).map(({ text, line, y }) => {
        if (!text) return null
        const f = dialTextStyle(font, r, line)
        return (
          <text
            key={line}
            y={r * y}
            fill={logoColor}
            fontSize={f.size}
            fontFamily={f.family}
            fontWeight={f.weight}
            letterSpacing={f.spacing}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {dialText(font, text)}
          </text>
        )
      })}
    </g>
  )
}
