// Browser check for the Windows workflow: the site started by START-HERE-Windows.bat works for the
// admin, a teacher and a student. Run from a folder where `playwright` is installed.
import { chromium } from "playwright";

const base = "http://localhost:3000";
const { BIS_ADMIN_EMAIL: adminEmail, BIS_ADMIN_PASSWORD: adminPassword, EXPECT_VERSION: version } = process.env;
let failures = 0;
const check = (label, ok, extra = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${extra ? ` — ${extra}` : ""}`);
};

const browser = await chromium.launch();
const errors = [];
async function newPage(lang = "en") {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "lang", value: lang, url: base }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message.slice(0, 200)}`));
  return page;
}
async function login(page, id, password) {
  await page.goto(`${base}/login`);
  await page.fill('input[name="login"]', id);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL(/dashboard|admin|teacher|platform|onboarding/), page.click('button[type="submit"]')]);
  return new URL(page.url()).pathname;
}
const path = (page) => new URL(page.url()).pathname;

const admin = await newPage();
check("admin logs in and lands in the admin panel", (await login(admin, adminEmail, adminPassword)) === "/admin");
check("admin can open the platform settings", (await admin.locator('aside a[href="/platform"]').count()) === 1);
await admin.goto(`${base}/admin/settings`);
check("software version is shown", (await admin.locator("main").innerText()).includes(version), version);

await admin.goto(`${base}/admin/staff`);
await admin.fill('input[name="name"]', "Windows Teacher");
await admin.fill('input[name="email"]', "teacher@windows-check.example");
await admin.fill('input[name="password"]', "teacher-pass-1");
await admin.getByRole("button", { name: "Create account" }).click();
const created = await admin.locator("p", { hasText: /Teacher ID: T\d+/ }).first().innerText();
const teacherId = created.match(/Teacher ID: (T\d+)/)?.[1];
check("teacher account gets a teacher ID", Boolean(teacherId), created);

await admin.goto(`${base}/admin/groups`);
await admin.fill('input[name="name"]', "Windows Group");
await admin.locator('select[name="teacherId"]').selectOption({ label: "Windows Teacher" });
await Promise.all([admin.waitForURL(/\/admin\/groups\/.+/), admin.getByRole("button", { name: "Create group" }).click()]);
await admin.goto(`${base}/admin/codes`);
await admin.getByLabel("Add students to a group").selectOption({ label: "Windows Group" });
await admin.getByRole("button", { name: "Create code" }).click();
const code = (await admin.locator("p", { hasText: /Code \w+ created/ }).first().innerText()).match(/Code (\w+) created/)?.[1];
check("student invite code created", Boolean(code), code);

const student = await newPage("uz");
await student.goto(`${base}/register?code=${code}`);
await student.fill('input[name="name"]', "Ali Valiyev");
await student.fill('input[name="email"]', "student@windows-check.example");
await student.fill('input[name="password"]', "student-pass-1");
await Promise.all([student.waitForURL(/onboarding/), student.click('button[type="submit"]')]);
check("student signs up with the code", path(student) === "/onboarding");
for (const area of ["/admin", "/teacher", "/platform"]) {
  await student.goto(`${base}${area}`);
  check(`student is kept out of ${area}`, !path(student).startsWith(area), path(student));
}

const teacher = await newPage();
check("teacher logs in with the teacher ID", (await login(teacher, teacherId.toLowerCase(), "teacher-pass-1")) === "/teacher");
await teacher.goto(`${base}/teacher/students`);
check("teacher sees the student in their group", (await teacher.locator("main").innerText()).includes("Ali Valiyev"));
await teacher.goto(`${base}/admin/staff`);
check("teacher is kept out of the admin panel", path(teacher) === "/teacher", path(teacher));

check("no errors in the browser", errors.length === 0, errors.join(" | "));
await browser.close();
process.exit(failures ? 1 : 0);
