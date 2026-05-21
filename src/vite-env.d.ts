/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GOOGLE_CLIENT_KEY: string
  readonly VITE_SUPERUSERS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
