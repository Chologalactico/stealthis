import { readFileSync } from "node:fs";
import path from "node:path";
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  // process.cwd() = apps/docs when build runs from that directory
  const filePath = path.resolve(process.cwd(), "../../packages/content/docs/llms.txt");

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    content = "# StealThis.dev LLM Context\nSee https://docs.stealthis.dev for full documentation.";
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
