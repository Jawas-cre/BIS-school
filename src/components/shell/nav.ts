export type NavItem = { href: string; label: string; icon: string; badge?: string };

export const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/roadmap", label: "Roadmap", icon: "Map" },
  { href: "/questions", label: "Question Bank", icon: "ListChecks" },
  { href: "/tests", label: "Mock Tests", icon: "ClipboardCheck" },
  { href: "/vocabulary", label: "Vocabulary", icon: "Languages" },
  { href: "/library", label: "Library", icon: "Library" },
  { href: "/universities", label: "Top Universities", icon: "GraduationCap" },
  { href: "/news", label: "What's New", icon: "Megaphone" },
  { href: "/assistant", label: "AI Assistant", icon: "Sparkles" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/students", label: "Students", icon: "Users" },
  { href: "/admin/groups", label: "Groups", icon: "Layers" },
  { href: "/admin/subjects", label: "Subjects", icon: "Shapes" },
  { href: "/admin/questions", label: "Questions", icon: "ListChecks" },
  { href: "/admin/tests", label: "Mock Tests", icon: "ClipboardCheck" },
  { href: "/admin/roadmap", label: "Roadmap", icon: "Map" },
  { href: "/admin/vocabulary", label: "Vocabulary", icon: "Languages" },
  { href: "/admin/library", label: "Library", icon: "Library" },
  { href: "/admin/news", label: "Announcements", icon: "Megaphone" },
  { href: "/admin/staff", label: "Staff", icon: "ShieldCheck" },
  { href: "/admin/settings", label: "Center settings", icon: "Settings" },
];

export const PLATFORM_NAV: NavItem[] = [
  { href: "/platform", label: "Centers", icon: "Building2" },
  { href: "/platform/universities", label: "Universities", icon: "GraduationCap" },
  { href: "/platform/news", label: "Announcements", icon: "Megaphone" },
];
