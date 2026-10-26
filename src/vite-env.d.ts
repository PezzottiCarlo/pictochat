/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_TG_API_ID: string;
  readonly VITE_TG_API_HASH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
