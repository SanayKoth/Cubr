import { useEffect } from 'react'
import { startSyncProcessor, stopSyncProcessor } from './processor'

export function useSyncProcessor(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    startSyncProcessor()
    return () => {
      stopSyncProcessor()
    }
  }, [enabled])
}
