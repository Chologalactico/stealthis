import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const resources = await getCollection("resources");

  const payload = {
    resources: resources.map((r) => {
      const rawSearchText = [
        r.data.title,
        r.data.description,
        ...(Array.isArray(r.data.tags) ? r.data.tags : []),
        ...(Array.isArray(r.data.tech) ? r.data.tech : []),
      ].join(" ");

      return {
        slug: r.data.slug,
        title: r.data.title,
        description: r.data.description,
        tags: r.data.tags || [],
        tech: r.data.tech || [],
        searchText: rawSearchText,
      };
    }),
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
