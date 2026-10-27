import {
  BEZEL_TYPES,
  CASE_FINISHES,
  CASE_SHAPES,
  CHRONO_LAYOUTS,
  CROWN_SIZES,
  DATE_POSITIONS,
  DIAL_FINISHES,
  DIAMETER_MAX,
  DIAMETER_MIN,
  HAND_STYLES,
  INDEX_TYPES,
  STRAP_TYPES,
  createDefaultDesign,
  type WatchDesign,
} from './watchDesign'

type Preset = Omit<WatchDesign, 'id'>

export const PRESETS: Record<string, Preset> = {
  Diver: {
    name: 'Diver',
    version: 1,
    case: { shape: 'round', diameter: 42, color: '#c9ccd1', finish: 'brushed' },
    bezel: { type: 'dive', color: '#c9ccd1', insertColor: '#111111', insertColor2: '#111111', markingColor: '#f4f4f4' },
    crown: { size: 'large', guards: true },
    dial: { color: '#101010', finish: 'plain', logoText: 'ABYSS', logoColor: '#f4f4f4' },
    complications: { date: '3h', chrono: 'none', subdialColor: '#101010', cyclops: false, gmt: false, gmtColor: '#d6402b' },
    indices: { type: 'dots', color: '#f2f2e6', minuteTrack: true },
    hands: { style: 'mercedes', color: '#f2f2e6', secondsColor: '#e0452b', lume: true },
    strap: { type: 'rubber', color: '#1a1a1a', accentColor: '#333333' },
  },
  Dress: {
    name: 'Dress',
    version: 1,
    case: { shape: 'round', diameter: 38, color: '#d8b46a', finish: 'polished' },
    bezel: { type: 'none', color: '#d8b46a', insertColor: '#d8b46a', insertColor2: '#d8b46a', markingColor: '#222222' },
    crown: { size: 'small', guards: false },
    dial: { color: '#f3efe6', finish: 'guilloche', logoText: 'ÉLÉGANCE', logoColor: '#3a3a3a' },
    complications: { date: 'none', chrono: 'none', subdialColor: '#f3efe6', cyclops: false, gmt: false, gmtColor: '#d6402b' },
    indices: { type: 'roman', color: '#2a2a2a', minuteTrack: true },
    hands: { style: 'dauphine', color: '#a07c33', secondsColor: '#a07c33', lume: false },
    strap: { type: 'leather', color: '#2b1a12', accentColor: '#2b1a12' },
  },
  Field: {
    name: 'Field',
    version: 1,
    case: { shape: 'round', diameter: 39, color: '#9a9d9f', finish: 'matte' },
    bezel: { type: 'none', color: '#9a9d9f', insertColor: '#9a9d9f', insertColor2: '#9a9d9f', markingColor: '#f4f4f4' },
    crown: { size: 'medium', guards: false },
    dial: { color: '#2f3b2a', finish: 'plain', logoText: 'OUTPOST', logoColor: '#e9e4d0' },
    complications: { date: 'none', chrono: 'none', subdialColor: '#2f3b2a', cyclops: false, gmt: false, gmtColor: '#d6402b' },
    indices: { type: 'arabic', color: '#e9e4d0', minuteTrack: true },
    hands: { style: 'baton', color: '#e9e4d0', secondsColor: '#e9a23b', lume: true },
    strap: { type: 'nato', color: '#4b5536', accentColor: '#c9b98f' },
  },
  Sport: {
    name: 'Sport',
    version: 1,
    case: { shape: 'cushion', diameter: 41, color: '#c9ccd1', finish: 'brushed' },
    bezel: { type: 'fluted', color: '#c9ccd1', insertColor: '#c9ccd1', insertColor2: '#c9ccd1', markingColor: '#f4f4f4' },
    crown: { size: 'medium', guards: false },
    dial: { color: '#2d5f73', finish: 'sunburst', logoText: 'NAUTIC', logoColor: '#f4f4f4' },
    complications: { date: '3h', chrono: 'none', subdialColor: '#2d5f73', cyclops: true, gmt: false, gmtColor: '#d6402b' },
    indices: { type: 'baton', color: '#f4f4f4', minuteTrack: false },
    hands: { style: 'baton', color: '#f4f4f4', secondsColor: '#f4f4f4', lume: true },
    strap: { type: 'metal', color: '#c9ccd1', accentColor: '#9da1a6' },
  },
  GMT: {
    name: 'GMT',
    version: 1,
    case: { shape: 'round', diameter: 40, color: '#c9ccd1', finish: 'brushed' },
    bezel: { type: 'gmt', color: '#c9ccd1', insertColor: '#b3242b', insertColor2: '#1c3f8f', markingColor: '#f4f4f4' },
    crown: { size: 'large', guards: true },
    dial: { color: '#0e0e10', finish: 'plain', logoText: 'VOYAGER', logoColor: '#f4f4f4' },
    complications: { date: '3h', chrono: 'none', subdialColor: '#0e0e10', cyclops: true, gmt: true, gmtColor: '#d6402b' },
    indices: { type: 'dots', color: '#f2f2e6', minuteTrack: true },
    hands: { style: 'mercedes', color: '#e4e6e8', secondsColor: '#e4e6e8', lume: true },
    strap: { type: 'metal', color: '#c9ccd1', accentColor: '#e2e4e7' },
  },
  Chronograph: {
    name: 'Chronograph',
    version: 1,
    case: { shape: 'round', diameter: 41, color: '#c9ccd1', finish: 'polished' },
    bezel: { type: 'smooth', color: '#c9ccd1', insertColor: '#111111', insertColor2: '#111111', markingColor: '#f4f4f4' },
    crown: { size: 'medium', guards: false },
    dial: { color: '#eeeae2', finish: 'plain', logoText: 'PANDA', logoColor: '#1a1a1a' },
    complications: { date: 'none', chrono: 'tricompax', subdialColor: '#141414', cyclops: false, gmt: false, gmtColor: '#d6402b' },
    indices: { type: 'baton', color: '#2a2a2a', minuteTrack: true },
    hands: { style: 'baton', color: '#1e1e1e', secondsColor: '#d6402b', lume: false },
    strap: { type: 'leather', color: '#7a4a2a', accentColor: '#efe3cf' },
  },
}

export function presetDesign(name: string): WatchDesign {
  const preset = PRESETS[name]
  return preset ? { ...structuredClone(preset), id: crypto.randomUUID() } : createDefaultDesign()
}

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

const randomColor = () =>
  '#' +
  Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('')

const METALS = ['#c9ccd1', '#d8b46a', '#b87e5a', '#3a3a3c', '#9a9d9f']
const LIGHTS = ['#f4f4f4', '#f2f2e6', '#e9e4d0']

export function randomDesign(): WatchDesign {
  const metal = pick(METALS)
  const dialColor = randomColor()
  const ink = pick(LIGHTS)
  return {
    id: crypto.randomUUID(),
    name: 'Random Watch',
    version: 1,
    case: {
      shape: pick(CASE_SHAPES),
      diameter: DIAMETER_MIN + Math.floor(Math.random() * (DIAMETER_MAX - DIAMETER_MIN + 1)),
      color: metal,
      finish: pick(CASE_FINISHES),
    },
    bezel: {
      type: pick(BEZEL_TYPES),
      color: metal,
      insertColor: randomColor(),
      insertColor2: randomColor(),
      markingColor: ink,
    },
    crown: { size: pick(CROWN_SIZES), guards: Math.random() < 0.3 },
    dial: { color: dialColor, finish: pick(DIAL_FINISHES), logoText: 'RANDOM', logoColor: ink },
    complications: {
      date: pick(DATE_POSITIONS),
      chrono: Math.random() < 0.3 ? pick(CHRONO_LAYOUTS) : 'none',
      subdialColor: randomColor(),
      cyclops: Math.random() < 0.5,
      gmt: Math.random() < 0.25,
      gmtColor: randomColor(),
    },
    indices: { type: pick(INDEX_TYPES), color: ink, minuteTrack: Math.random() < 0.6 },
    hands: { style: pick(HAND_STYLES), color: ink, secondsColor: randomColor(), lume: Math.random() < 0.7 },
    strap: { type: pick(STRAP_TYPES), color: randomColor(), accentColor: randomColor() },
  }
}
