import { useEffect, useMemo, type DependencyList } from 'react'

/** useMemo for three.js geometries and textures: frees the GPU copy when it is replaced or unmounted. */
export function useDisposable<T extends { dispose(): void } | null>(factory: () => T, deps: DependencyList): T {
  // Callers supply the deps, exactly as with useMemo itself.
  // eslint-disable-next-line react/use-memo, react-hooks/exhaustive-deps
  const value = useMemo(factory, deps)
  useEffect(() => () => value?.dispose(), [value])
  return value
}
