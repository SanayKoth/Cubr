import { useEffect, useState } from 'react'
import type { InspectionCue } from './types'

/*
  Visual flash only. Sound is played on the cue frame in the timer hooks so
  it is not waiting on React.
*/
export function useInspectionAlert(cue: InspectionCue): 8 | 12 | null {
  const [flash, setFlash] = useState<8 | 12 | null>(null)

  useEffect(() => {
    if (cue !== 8 && cue !== 12) {
      setFlash(null)
      return
    }

    setFlash(cue)
    const id = window.setTimeout(() => setFlash(null), 900)
    return () => window.clearTimeout(id)
  }, [cue])

  return flash
}
