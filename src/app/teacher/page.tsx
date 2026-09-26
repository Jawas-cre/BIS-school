import { pageTitle } from "@/lib/i18n/server";

// Same page as the admin overview; it shows a teacher only their own groups and students.
export { default } from "@/app/admin/page";

export const generateMetadata = pageTitle((t) => t.teacher.title);
