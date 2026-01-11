/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATABYTES_BACKEND_BASE_URL: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
