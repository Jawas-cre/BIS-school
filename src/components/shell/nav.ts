import type { Dict } from "@/lib/i18n/dictionaries";

export type NavItem = { href: string; label: keyof Dict["nav"]; icon: string; badge?: string };

export const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "dashboard", icon: "LayoutDashboard" },
  { href: "/roadmap", label: "roadmap", icon: "Map" },
  { href: "/questions", label: "questions", icon: "ListChecks" },
  { href: "/tests", label: "tests", icon: "ClipboardCheck" },
  { href: "/vocabulary", label: "vocabulary", icon: "Languages" },
  { href: "/library", label: "library", icon: "Library" },
  { href: "/universities", label: "universities", icon: "GraduationCap" },
  { href: "/news", label: "news", icon: "Megaphone" },
  { href: "/assistant", label: "assistant", icon: "Sparkles" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "overview", icon: "LayoutDashboard" },
  { href: "/admin/students", label: "students", icon: "Users" },
  { href: "/admin/codes", label: "codes", icon: "KeyRound" },
  { href: "/admin/groups", label: "groups", icon: "Layers" },
  { href: "/admin/subjects", label: "subjects", icon: "Shapes" },
  { href: "/admin/questions", label: "adminQuestions", icon: "ListChecks" },
  { href: "/admin/tests", label: "tests", icon: "ClipboardCheck" },
  { href: "/admin/roadmap", label: "roadmap", icon: "Map" },
  { href: "/admin/vocabulary", label: "vocabulary", icon: "Languages" },
  { href: "/admin/library", label: "library", icon: "Library" },
  { href: "/admin/news", label: "announcements", icon: "Megaphone" },
  { href: "/admin/staff", label: "staff", icon: "ShieldCheck" },
  { href: "/admin/settings", label: "settings", icon: "Settings" },
];

/** Teachers: their own groups and students, plus the center's learning content. */
export const TEACHER_NAV: NavItem[] = [
  { href: "/teacher", label: "overview", icon: "LayoutDashboard" },
  { href: "/teacher/groups", label: "myGroups", icon: "Layers" },
  { href: "/teacher/students", label: "myStudents", icon: "Users" },
  { href: "/teacher/questions", label: "adminQuestions", icon: "ListChecks" },
  { href: "/teacher/tests", label: "tests", icon: "ClipboardCheck" },
  { href: "/teacher/roadmap", label: "roadmap", icon: "Map" },
  { href: "/teacher/vocabulary", label: "vocabulary", icon: "Languages" },
  { href: "/teacher/library", label: "library", icon: "Library" },
  { href: "/teacher/news", label: "announcements", icon: "Megaphone" },
];

export const PLATFORM_NAV: NavItem[] = [
  { href: "/platform", label: "centers", icon: "Building2" },
  { href: "/platform/universities", label: "platformUniversities", icon: "GraduationCap" },
  { href: "/platform/news", label: "announcements", icon: "Megaphone" },
];
