import { createContext, useContext } from 'react'

/** Lume color: the classic green of Super-LumiNova. */
export const LUME = '#8dffc0'

/** True while the 3D view is in "lights off" mode and lume should glow. */
export const NightContext = createContext(false)

/** Emissive props that make a material glow only at night. */
export function useLumeGlow(intensity = 1.6) {
  const night = useContext(NightContext)
  return { emissive: LUME, emissiveIntensity: night ? intensity : 0 }
}
