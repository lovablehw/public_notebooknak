// Global type declarations for runtime configuration
// The config.js is injected at runtime by the container

interface AppConfig {
  KEYCLOAK_REDIRECT_URI?: string;
}

declare global {
  interface Window {
    appConfig?: AppConfig;
  }
}

export {};
