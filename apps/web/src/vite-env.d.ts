/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public base URL of the CondoScope API. Empty or unset = always use the bundled demo data. */
  readonly VITE_API_URL?: string;
}
