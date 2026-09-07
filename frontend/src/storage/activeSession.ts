const ACTIVE_SESSION_KEY = 'cubr.activeSessionId'

export function readActiveSessionId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_SESSION_KEY)
  } catch {
    return null
  }
}

export function writeActiveSessionId(id: string) {
  try {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, id)
  } catch {
    // private mode — last-session restore is best-effort
  }
}
