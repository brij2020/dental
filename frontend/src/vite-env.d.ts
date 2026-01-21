/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_MODE: string;
  readonly VITE_API_URL: string;
  readonly VITE_FRONTEND_URL: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ENABLE_DEV_TOOLS: string;
  readonly VITE_API_TIMEOUT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}