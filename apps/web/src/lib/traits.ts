/** FEATURES.md §5.6 — display labels for the trait keys the API stores. Keys must match report-card.ts. */
export const TRAIT_LABELS: Record<string, string> = {
  punctuality: "Punctuality",
  neatness: "Neatness",
  politeness: "Politeness",
  honesty: "Honesty",
  cooperation: "Cooperation",
  attentiveness: "Attentiveness",
  handwriting: "Handwriting",
  sports: "Sports",
  drawing: "Drawing",
  craft: "Craft",
  musicalSkill: "Musical skill",
};

export const TRAIT_RATINGS = [1, 2, 3, 4, 5] as const;
