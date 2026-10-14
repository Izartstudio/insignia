const origin = "https://lumikai.webflow.io";
export const navigation = {
  home: origin,
  primary: [
    { label: "Thesis", href: `${origin}/thesis` },
    { label: "Team", href: `${origin}/the-team` },
    { label: "Portfolio", href: `${origin}/portfolio` },
    { label: "Insignia", href: "/" },
  ],
  secondary: [
    { label: "Pixels", href: `${origin}/pixels` },
    { label: "Research", href: `${origin}/research` },
    { label: "Media", href: `${origin}/media` },
    { label: "Contact Us", href: `${origin}/contact-us` },
  ],
  pitch: `${origin}/contact-us`,
} as const;

export const navMotion = {
  backdrop: 0.65, panel: 1, logo: 0.75, logoStart: 0.3,
  links: 0.8, linksStart: 0.38, stagger: 0.055,
  footer: 0.7, footerStart: 0.93, total: 1.63, closeSpeed: 1.5,
  hover: 0.4, hoverStagger: 0.02, logoScroll: 0.5,
  scrollThreshold: 50, scrollTolerance: 2,
} as const;
