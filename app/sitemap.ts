import type { MetadataRoute } from "next";
import { listPublicTierListIds } from "@/lib/serverTierList";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lists = await listPublicTierListIds();

  return [
    {
      url: "https://rankster.fr",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...lists.map((list) => ({
      url: `https://rankster.fr/editor/${list.id}`,
      lastModified: new Date(list.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
