/// <reference types="vite/client" />

// Type our own env vars so import.meta.env.VITE_API_BASE_URL is string | undefined,
// not `any`. Keeps the "no any" rule intact at the env boundary.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
