// BIS_APP="mock" runs this program as the CD IELTS mock on its own site (the cd-ielts-mock zip, see
// scripts/make-zip.mjs): the candidate site is the home page, staff sign in on the mock's own login
// page, and BIS Learn's pages are closed. Without it, the same mock lives inside BIS Learn at /mock.
export const MOCK_ONLY = process.env.BIS_APP === "mock";

// Browsers keep cookies per computer name, not per port, so the two sites on one laptop
// (localhost:3000 and localhost:3100) would sign each other out with the same cookie names.
export const COOKIE_PREFIX = MOCK_ONLY ? "cdm_" : "";

/** Where staff sign in. */
export const STAFF_LOGIN = MOCK_ONLY ? "/mock/staff" : "/login";
