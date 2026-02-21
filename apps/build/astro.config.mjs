import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "static",
  site: "https://build.stealthis.dev",
  adapter: cloudflare(),
  server: { port: 4324 },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
});
