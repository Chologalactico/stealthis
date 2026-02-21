const isDev = import.meta.env.DEV;

export const SITE_URLS = {
  www: isDev ? "http://localhost:4321" : "https://stealthis.dev",
  docs: isDev ? "http://localhost:4322" : "https://docs.stealthis.dev",
  lab: isDev ? "http://localhost:4323" : "https://lab.stealthis.dev",
} as const;
