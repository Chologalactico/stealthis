# Astro + Tailwind Starter

## Quick start

```bash
bun create astro@latest my-site
cd my-site
bun add -d tailwindcss
bunx tailwindcss init -p
```

## Suggested structure

```
src/
  components/
    Nav.astro
    Hero.astro
    FeatureGrid.astro
  layouts/
    Base.astro
  pages/
    index.astro
  styles/
    global.css
```

## Tailwind setup (astro.config.mjs)

```js
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [tailwind()],
});
```

## Notes

- Keep components small and composable.
- Use `Base.astro` to centralize metadata and layout.
