export interface CuratedCollection {
  id: string;
  titleKey: string;
  descriptionKey: string;
  filters: {
    category?: string;
    tech?: string;
    difficulty?: string;
    search?: string;
  };
}

export const curatedCollections: CuratedCollection[] = [
  {
    id: "motion",
    titleKey: "collection.motion.title",
    descriptionKey: "collection.motion.desc",
    filters: { category: "web-animations" },
  },
  {
    id: "hero",
    titleKey: "collection.hero.title",
    descriptionKey: "collection.hero.desc",
    filters: { search: "hero" },
  },
  {
    id: "cards",
    titleKey: "collection.cards.title",
    descriptionKey: "collection.cards.desc",
    filters: { search: "card" },
  },
  {
    id: "remotion",
    titleKey: "collection.remotion.title",
    descriptionKey: "collection.remotion.desc",
    filters: { category: "remotion" },
  },
];
