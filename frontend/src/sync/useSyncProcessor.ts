import { useEffect } from 'react'
import { isRemoteSyncEnabled } from '../api/client'
import { startSyncProcessor, stopSyncProcessor } from './processor'

export function useSyncProcessor(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !isRemoteSyncEnabled()) return
    startSyncProcessor()
    return () => {
      stopSyncProcessor()
    }
  }, [enabled])
}
