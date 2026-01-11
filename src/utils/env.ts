interface ImportMetaEnv {
  readonly VITE_DATABYTES_BACKEND_BASE_URL: string;
  // Add other env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

function getEnvVar(key: keyof ImportMetaEnv, fallback?: string): string {
  const value = import.meta.env[key];
  
  if (!value && !fallback) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please set it in your .env file.`
    );
  }
  
  return value || fallback || '';
}

export const env = {
  VITE_DATABYTES_BACKEND_BASE_URL: getEnvVar(
    'VITE_DATABYTES_BACKEND_BASE_URL',
    'http://192.168.191.230:8000/api'
  ),
} as const;
