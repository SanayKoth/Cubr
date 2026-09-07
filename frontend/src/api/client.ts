import { ApiError } from './errors'
import type {
  CreateSessionRequest,
  CreateSolveRequest,
  SessionResponse,
  SolveResponse,
} from './types.ts'

/*
  The backend is called DIRECTLY (no Vite dev proxy) so this exercises the real
  cross-origin CORS path. The processor is push-only: create/update via POST,
  delete via DELETE. GET stays available for diagnostics and must not replace
  local IndexedDB state.
*/
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:8080' : '')

export function isRemoteSyncEnabled(): boolean {
  return API_BASE_URL.length > 0
}

async function readError(response: Response, fallback: string): Promise<ApiError> {
  return new ApiError(response.status, `${fallback} failed with status ${response.status}`)
}

export async function getSessions(): Promise<SessionResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`)
  if (!response.ok) {
    throw await readError(response, 'GET /api/sessions')
  }
  return (await response.json()) as SessionResponse[]
}

export async function createSession(body: CreateSessionRequest): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw await readError(response, 'POST /api/sessions')
  }
  return (await response.json()) as SessionResponse
}

export async function createSolve(
  sessionId: string,
  body: CreateSolveRequest,
): Promise<SolveResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/solves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw await readError(response, `POST /api/sessions/${sessionId}/solves`)
  }
  return (await response.json()) as SolveResponse
}

export async function deleteSolve(solveId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/solves/${solveId}`, {
    method: 'DELETE',
  })
  if (!response.ok && response.status !== 404) {
    throw await readError(response, `DELETE /api/solves/${solveId}`)
  }
}
