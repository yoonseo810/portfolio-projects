export const profile = {
  name: "Yoon Seong (Michael) Seo",
  role: "Front-End Software Developer",
  location: "Richmond Hill, ON · open to remote",
  email: "yoonseong.seo810@gmail.com",
  github: "https://github.com/yoonseo810",
  linkedin: "https://www.linkedin.com/in/yoonseong-seo-373b84234",
  summary:
    "Front-end developer with 3 years of production experience building React and TypeScript applications for airport self-service systems and payment platforms. Expanding into full-stack work with Next.js, Postgres and AI-powered features.",
};

export type Experience = {
  company: string;
  title: string;
  period: string;
  highlights: string[];
};

export const experience: Experience[] = [
  {
    company: "Embross",
    title: "Software Developer, Front End",
    period: "Aug 2024 – Present",
    highlights: [
      "Build front-end applications for passenger self-service products: e-gates, biometric boarding, bag drop, check-in kiosks and self-tagging.",
      "Deliver features to IATA and CUSS specifications across regular release cycles.",
      "Resolve production incidents and ship fixes for live airport operations.",
    ],
  },
  {
    company: "Moneris",
    title: "Software Developer, Front End",
    period: "2023 – 2024",
    highlights: [
      "Developed features for Merchant Direct 2, a React merchant portal.",
      "Migrated legacy JavaScript modules to TypeScript.",
      "Built reusable library components and page layouts; enforced unit tests before merge.",
    ],
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "SQL", "Java", "C++"] },
  { group: "Front end", items: ["React", "Next.js", "Redux", "Tailwind CSS", "Sass", "Accessibility"] },
  { group: "Back end & data", items: ["Node.js", "Express", "REST", "PostgreSQL", "NoSQL"] },
  { group: "Testing & delivery", items: ["Jest", "Vitest", "Testing Library", "Playwright", "CI/CD"] },
];
