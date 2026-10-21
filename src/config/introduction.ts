export const introductionSlides = [
  {
    number: "01",
    text: "Lumikai’s annual LP summit - Insignia is India’s signature event for interactive media.",
  },

  {
    number: "02",
    text: "An invite only gathering which brings together 100 of the industry's most consequential decision makers. The conversations that shape the industry happen under one roof over two days.",
  },
  {
    number: "03",
    text: "Founders building category-defining companies meet global investors, tech visionaries and the policy makers who help define the way forward.",
  },
] as const;

export const introductionConfig = {
  scrollDistanceInViewports: 2.2,
  scrub: 1,
  firstTransition: { start: 0.2, end: 0.35 },
  secondTransition: { start: 0.55, end: 0.7 },
} as const;
