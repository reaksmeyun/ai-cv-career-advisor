import { RESPONSIBLE_AI_MESSAGE } from "@/components/ui";
import type { CareerAnalysis } from "@/types/analysis";

/**
 * Realistic example analysis used for the mock workflow and the homepage /
 * analyzer "example preview". This is demonstration content only — it is NOT a
 * real AI result and is always labelled as an example in the UI. It matches the
 * `EXAMPLE_CV_TEXT` persona so the example CV → example analysis feels coherent.
 */
export const EXAMPLE_ANALYSIS: CareerAnalysis = {
  professionalSummary: {
    summary:
      "A final-year software engineering student with hands-on experience building responsive web applications using React, Next.js, and TypeScript. Demonstrates practical full-stack exposure through personal projects and team coursework, with clear interest in frontend and junior developer roles.",
    profileLevel: "Student / Entry-level",
    mainCareerDirection: "Frontend & full-stack web development",
  },
  technicalSkills: {
    programmingLanguages: ["JavaScript", "TypeScript", "Python", "SQL"],
    frameworks: ["React", "Next.js", "Tailwind CSS", "Node.js", "Express"],
    databases: ["PostgreSQL", "MySQL"],
    tools: ["Git", "GitHub", "Docker", "Figma", "REST APIs"],
    other: ["Drizzle ORM", "Responsive design"],
  },
  softSkills: [
    {
      name: "Teamwork",
      evidence:
        "Worked in a team of four on a university course-registration portal and contributed to shared documentation.",
    },
    {
      name: "Communication",
      evidence:
        "Presented the course portal project to faculty and reported issues during user acceptance testing.",
    },
    {
      name: "Mentoring",
      evidence:
        "Volunteered as a tutor for first-year programming students.",
    },
  ],
  recommendedRoles: [
    {
      slug: "junior-frontend-developer",
      title: "Junior Frontend Developer",
      matchLevel: "High",
      explanation:
        "Your React, Next.js, TypeScript, and Tailwind CSS experience and responsive-website projects align closely with junior frontend expectations.",
      matchingSkills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Git"],
      missingSkills: ["Automated testing", "Accessibility (a11y)"],
      roleDescription:
        "Builds and maintains user-facing web interfaces, turning designs into responsive, accessible components and collaborating with backend developers on API integration.",
      suggestedProjects: [
        {
          title: "Accessible component library",
          goal: "Build a small set of reusable, accessible UI components with keyboard support.",
          skillsPracticed: ["React", "TypeScript", "Accessibility"],
          difficulty: "Intermediate",
        },
        {
          title: "Responsive dashboard clone",
          goal: "Recreate a real product dashboard to practice layout and state management.",
          skillsPracticed: ["Next.js", "Tailwind CSS", "State management"],
          difficulty: "Intermediate",
        },
        {
          title: "Personal portfolio with tests",
          goal: "Ship a portfolio site and add component tests to learn testing basics.",
          skillsPracticed: ["React", "Testing", "CI/CD"],
          difficulty: "Beginner",
        },
      ],
      roadmap: [
        "Strengthen JavaScript and React fundamentals",
        "Build two complete, polished frontend projects",
        "Learn component testing and debugging",
        "Improve your GitHub portfolio and READMEs",
        "Apply for internships, apprenticeships, or junior frontend roles",
      ],
    },
    {
      slug: "full-stack-developer-apprentice",
      title: "Full-Stack Developer Apprentice",
      matchLevel: "Medium",
      explanation:
        "You have both frontend and backend exposure (Node.js, Express, PostgreSQL), which suits an apprenticeship where you grow across the stack.",
      matchingSkills: ["Node.js", "Express", "PostgreSQL", "REST APIs", "React"],
      missingSkills: ["Automated testing", "Authentication & security", "CI/CD"],
      roleDescription:
        "Works across frontend and backend under mentorship, implementing features end-to-end from database to UI while learning production practices.",
      suggestedProjects: [
        {
          title: "Full-stack task manager",
          goal: "Build a CRUD app with authentication and a PostgreSQL backend.",
          skillsPracticed: ["Node.js", "Express", "PostgreSQL", "Auth"],
          difficulty: "Intermediate",
        },
        {
          title: "REST API with tests",
          goal: "Design a documented REST API and cover it with automated tests.",
          skillsPracticed: ["REST APIs", "Testing", "Node.js"],
          difficulty: "Intermediate",
        },
        {
          title: "Dockerized deployment",
          goal: "Containerize an app and set up a simple CI pipeline.",
          skillsPracticed: ["Docker", "CI/CD", "DevOps basics"],
          difficulty: "Advanced",
        },
      ],
      roadmap: [
        "Solidify backend fundamentals with Node.js and Express",
        "Build one complete full-stack project with authentication",
        "Add automated tests and a CI pipeline",
        "Practice deploying with Docker",
        "Apply for apprenticeship or junior full-stack roles",
      ],
    },
    {
      slug: "software-developer-intern",
      title: "Software Developer Intern",
      matchLevel: "Developing",
      explanation:
        "Your coursework, projects, and collaboration experience make you a solid intern candidate while you continue building depth in core computer-science topics.",
      matchingSkills: ["JavaScript", "Python", "SQL", "Git", "Teamwork"],
      missingSkills: ["Data structures & algorithms", "Automated testing"],
      roleDescription:
        "Supports a development team on well-scoped tasks, learning the codebase and engineering workflow while contributing bug fixes and small features.",
      suggestedProjects: [
        {
          title: "Algorithms practice log",
          goal: "Solve and document data-structure and algorithm problems weekly.",
          skillsPracticed: ["Algorithms", "Python", "Problem solving"],
          difficulty: "Beginner",
        },
        {
          title: "Open-source first contributions",
          goal: "Make small documentation or bug-fix contributions to open-source projects.",
          skillsPracticed: ["Git", "Collaboration", "Reading code"],
          difficulty: "Beginner",
        },
        {
          title: "CLI utility",
          goal: "Build a small command-line tool to practice clean, tested code.",
          skillsPracticed: ["Python", "Testing", "CLI design"],
          difficulty: "Intermediate",
        },
      ],
      roadmap: [
        "Review core data structures and algorithms",
        "Build small, well-tested projects",
        "Contribute to an open-source project",
        "Polish your resume and GitHub profile",
        "Apply for software developer internships",
      ],
    },
  ],
  missingSkills: [
    {
      name: "Automated testing",
      reason:
        "Most junior and internship roles expect at least basic testing to ensure code reliability.",
      priority: "High",
      suggestedAction:
        "Learn a testing framework such as Vitest or Jest and add tests to an existing project.",
    },
    {
      name: "Data structures & algorithms",
      reason:
        "Commonly assessed in technical interviews and strengthens problem-solving skills.",
      priority: "Medium",
      suggestedAction:
        "Practice a few problems weekly and revisit core structures like arrays, maps, and trees.",
    },
    {
      name: "Accessibility (a11y)",
      reason:
        "Accessible interfaces are increasingly required for frontend positions.",
      priority: "Medium",
      suggestedAction:
        "Learn semantic HTML, ARIA basics, and test with a keyboard and screen reader.",
    },
    {
      name: "CI/CD",
      reason:
        "Understanding automated build and deployment pipelines is valuable in team environments.",
      priority: "Low",
      suggestedAction:
        "Set up a simple GitHub Actions workflow to run tests on each push.",
    },
  ],
  learningRecommendations: [
    {
      title: "Learn automated testing fundamentals",
      reason: "Testing is expected in most junior roles and improves confidence in your code.",
      suggestedAction: "Complete a Vitest or Jest tutorial and test a project you already built.",
      level: "Beginner",
    },
    {
      title: "Practice data structures & algorithms",
      reason: "Prepares you for technical interviews and strengthens fundamentals.",
      suggestedAction: "Solve two problems per week and write short explanations of your solutions.",
      level: "Intermediate",
    },
    {
      title: "Study web accessibility",
      reason: "Makes your frontend work more inclusive and interview-ready.",
      suggestedAction: "Follow an accessibility course and audit one of your sites.",
      level: "Beginner",
    },
    {
      title: "Set up a CI pipeline",
      reason: "Demonstrates awareness of professional development workflows.",
      suggestedAction: "Add GitHub Actions to run your tests automatically.",
      level: "Advanced",
    },
  ],
  responsibleAiNotice: RESPONSIBLE_AI_MESSAGE,
};
