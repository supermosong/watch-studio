import { useEffect, useState } from 'react'

/** Current time, updated on each whole second so the seconds hand ticks in step with the clock. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        setNow(new Date())
        schedule()
      }, 1000 - (Date.now() % 1000))
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [])
  return now
}
