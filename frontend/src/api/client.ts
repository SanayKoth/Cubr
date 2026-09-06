import type { SessionResponse } from './types'

/*
  The backend is called DIRECTLY (no Vite dev proxy) so this exercises the real
  cross-origin CORS path in development, the same shape it will use in
  production. The base URL comes from VITE_API_BASE_URL, defaulting to the local
  backend. Only the functions this step actually uses live here; more endpoints
  are added in the steps that need them.
*/
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function getSessions(): Promise<SessionResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`)
  if (!response.ok) {
    throw new Error(`GET /api/sessions failed with status ${response.status}`)
  }
  return (await response.json()) as SessionResponse[]
}
