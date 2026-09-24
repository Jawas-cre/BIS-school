// Parameterised generators for original Digital-SAT-style math questions.
// Every generator computes the answer key from the same numbers it prints,
// so keys and explanations are always consistent.

export type GenQuestion = {
  section: "MATH" | "RW";
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: "MCQ" | "SPR";
  passage?: string;
  stem: string;
  choices?: string[];
  answer: string;
  explanation: string;
};

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
export function shuffle<T>(rng: Rng, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D"];

/** Shuffle a correct choice among distractors; guarantees 4 unique options. */
export function mcq(rng: Rng, correct: string, distractors: string[], fallback: () => string) {
  const pool: string[] = [];
  for (const d of distractors) if (d !== correct && !pool.includes(d)) pool.push(d);
  let guard = 0;
  while (pool.length < 3 && guard++ < 50) {
    const d = fallback();
    if (d !== correct && !pool.includes(d)) pool.push(d);
  }
  const choices = shuffle(rng, [correct, ...pool.slice(0, 3)]);
  return { choices, answer: LETTERS[choices.indexOf(correct)] };
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** Reduced fraction as text, e.g. "3/4" or "-2"; also a decimal for SPR keys. */
function frac(n: number, d: number) {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1;
  const nn = n / g;
  const dd = d / g;
  return {
    text: dd === 1 ? `${nn}` : `${nn}/${dd}`,
    tex: dd === 1 ? `${nn}` : `${nn < 0 ? "-" : ""}\\frac{${Math.abs(nn)}}{${dd}}`,
    value: nn / dd,
  };
}

const sgn = (n: number) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
const coef = (n: number, v: string) => (n === 1 ? v : n === -1 ? `-${v}` : `${n}${v}`);
const r2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) =>
  `\\$${Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nonZero = (rng: Rng, lo: number, hi: number) => {
  let v = 0;
  while (v === 0) v = int(rng, lo, hi);
  return v;
};

type Gen = (rng: Rng) => GenQuestion;

const M = (q: Omit<GenQuestion, "section">): GenQuestion => ({ section: "MATH", ...q });

// ─── Algebra ────────────────────────────────────────────────────────────────

const linearOneVar: Gen = (rng) => {
  const a = int(rng, 2, 9);
  const x = int(rng, -8, 12);
  const b = nonZero(rng, -20, 20);
  const c = a * x + b;
  const { choices, answer } = mcq(rng, `${x}`, [`${x + 1}`, `${-x}`, `${x - 2}`, `${Math.round(c / a)}`], () => `${x + int(rng, 3, 9)}`);
  return M({
    skill: "Linear equations in one variable",
    difficulty: "EASY",
    type: "MCQ",
    stem: `If $${a}x ${sgn(b)} = ${c}$, what is the value of $x$?`,
    choices,
    answer,
    explanation: `${b > 0 ? "Subtract" : "Add"} $${Math.abs(b)}$ ${b > 0 ? "from" : "to"} both sides to get $${a}x = ${c - b}$. Then divide both sides by $${a}$: $x = ${x}$.`,
  });
};

const linearOneVarWord: Gen = (rng) => {
  const fee = pick(rng, [25, 30, 40, 45, 50, 60]);
  const monthly = pick(rng, [12, 15, 18, 20, 22, 25, 35]);
  const months = int(rng, 3, 12);
  const total = fee + monthly * months;
  const place = pick(rng, ["gym", "language club", "robotics studio", "swimming pool"]);
  return M({
    skill: "Linear equations in one variable",
    difficulty: "EASY",
    type: "SPR",
    stem: `A ${place} charges a one-time registration fee of ${money(fee)} plus ${money(monthly)} per month. Dilnoza paid a total of ${money(total)}. For how many months did she pay?`,
    answer: `${months}`,
    explanation: `Let $m$ be the number of months: $${fee} + ${monthly}m = ${total}$. Subtract ${fee}: $${monthly}m = ${total - fee}$, so $m = ${months}$.`,
  });
};

const linearFunctionEval: Gen = (rng) => {
  const m = nonZero(rng, -6, 7);
  const b = int(rng, -15, 15);
  const k = nonZero(rng, -6, 8);
  return M({
    skill: "Linear functions",
    difficulty: "EASY",
    type: "SPR",
    stem: `The function $f$ is defined by $f(x) = ${coef(m, "x")} ${sgn(b)}$. What is the value of $f(${k})$?`,
    answer: `${m * k + b}`,
    explanation: `Substitute $x = ${k}$: $f(${k}) = ${m}(${k}) ${sgn(b)} = ${m * k} ${sgn(b)} = ${m * k + b}$.`,
  });
};

const linearFunctionFromPoints: Gen = (rng) => {
  const m = nonZero(rng, -5, 6);
  const b = int(rng, -10, 12);
  const x1 = int(rng, -3, 2);
  const x2 = x1 + int(rng, 2, 5);
  const y1 = m * x1 + b;
  const y2 = m * x2 + b;
  const fx = (mm: number, bb: number) => `$f(x) = ${coef(mm, "x")} ${sgn(bb)}$`;
  const correct = fx(m, b);
  const { choices, answer } = mcq(rng, correct, [fx(-m, b), fx(m, -b), fx(m, b + m)], () => fx(m + int(rng, 1, 3), b));
  return M({
    skill: "Linear functions",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `For the linear function $f$, $f(${x1}) = ${y1}$ and $f(${x2}) = ${y2}$. Which equation defines $f$?`,
    choices,
    answer,
    explanation: `The slope is $\\dfrac{${y2} - (${y1})}{${x2} - (${x1})} = \\dfrac{${y2 - y1}}{${x2 - x1}} = ${m}$. Using $f(${x1}) = ${y1}$: $${y1} = ${m}(${x1}) + b$, so $b = ${b}$. Therefore ${correct}.`,
  });
};

const twoVarSlope: Gen = (rng) => {
  const a = nonZero(rng, -9, 9);
  const bb = pick(rng, [2, 3, 4, 5, 6, -2, -3, -4]);
  const c = int(rng, -20, 30);
  const slope = frac(-a, bb);
  return M({
    skill: "Linear equations in two variables",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `What is the slope of the line in the $xy$-plane with equation $${coef(a, "x")} ${bb < 0 ? "-" : "+"} ${Math.abs(bb)}y = ${c}$?`,
    answer: slope.text.includes("/") ? `${slope.text}|${slope.value.toFixed(4).replace(/0+$/, "")}` : slope.text,
    explanation: `Solve for $y$: $${Math.abs(bb) === 1 ? "" : bb}y = ${coef(-a, "x")} ${sgn(c)}$, so $y = ${slope.tex}x + \\ldots$ The slope is the coefficient of $x$: $${slope.tex}$.`,
  });
};

const twoVarContext: Gen = (rng) => {
  const adult = pick(rng, [8, 10, 12, 15, 18]);
  let child = pick(rng, [4, 5, 6, 7, 9]);
  if (child === adult) child -= 1;
  const total = int(rng, 20, 60) * adult + int(rng, 5, 30) * child;
  const eq = (p: number, q: number, t: number) => `$${p}a + ${q}c = ${t}$`;
  const correct = eq(adult, child, total);
  const { choices, answer } = mcq(rng, correct, [eq(child, adult, total), `$${adult}a = ${child}c + ${total}$`, `$a + c = ${total}$`], () => eq(adult + 1, child, total));
  return M({
    skill: "Linear equations in two variables",
    difficulty: "EASY",
    type: "MCQ",
    stem: `A museum sells adult tickets for ${money(adult)} each and child tickets for ${money(child)} each. On Saturday, ticket sales totaled ${money(total)}. Which equation represents the number of adult tickets, $a$, and child tickets, $c$, sold on Saturday?`,
    choices,
    answer,
    explanation: `Adult tickets bring in $${adult}a$ dollars and child tickets bring in $${child}c$ dollars. Their sum is the total: ${correct}.`,
  });
};

const systemSum: Gen = (rng) => {
  const x = int(rng, -6, 9);
  const y = int(rng, -6, 9);
  let a1 = 0, b1 = 0, a2 = 0, b2 = 0;
  do {
    a1 = nonZero(rng, -5, 6);
    b1 = nonZero(rng, -5, 6);
    a2 = nonZero(rng, -5, 6);
    b2 = nonZero(rng, -5, 6);
  } while (a1 * b2 - a2 * b1 === 0);
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  const ask = pick(rng, ["x + y", "x - y", "x"] as const);
  const value = ask === "x + y" ? x + y : ask === "x - y" ? x - y : x;
  return M({
    skill: "Systems of linear equations",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `$$\n\\begin{aligned} ${coef(a1, "x")} ${b1 < 0 ? "-" : "+"} ${coef(Math.abs(b1), "y")} &= ${c1} \\\\ ${coef(a2, "x")} ${b2 < 0 ? "-" : "+"} ${coef(Math.abs(b2), "y")} &= ${c2} \\end{aligned}\n$$\n\nThe solution to the system of equations above is $(x, y)$. What is the value of $${ask}$?`,
    answer: `${value}`,
    explanation: `Solving the system (for example by elimination) gives $x = ${x}$ and $y = ${y}$. Check: $${a1}(${x}) ${b1 < 0 ? "-" : "+"} ${Math.abs(b1)}(${y}) = ${c1}$ and $${a2}(${x}) ${b2 < 0 ? "-" : "+"} ${Math.abs(b2)}(${y}) = ${c2}$. Therefore $${ask} = ${value}$.`,
  });
};

const systemNoSolution: Gen = (rng) => {
  const a1 = int(rng, 2, 6);
  const k = int(rng, 2, 9);
  const n = int(rng, 2, 4);
  const c1 = int(rng, 3, 15);
  let c2 = int(rng, 3, 40);
  if (c2 === n * c1) c2 += 1;
  return M({
    skill: "Systems of linear equations",
    difficulty: "HARD",
    type: "SPR",
    stem: `$$\n\\begin{aligned} ${a1}x + ky &= ${c1} \\\\ ${n * a1}x + ${n * k}y &= ${c2} \\end{aligned}\n$$\n\nIn the system of equations above, $k$ is a constant. For what value of $k$ does the system have no solution?`,
    answer: `${k}`,
    explanation: `A linear system has no solution when the lines are parallel but distinct: the ratios of the $x$- and $y$-coefficients match, but the constants don't. The $x$-coefficients have ratio $${n * a1} / ${a1} = ${n}$, so we need $${n * k} / k = ${n}$, giving $k = ${k}$. The constants have ratio $${c2}/${c1} \\ne ${n}$, so the lines are distinct.`,
  });
};

const inequalityCheck: Gen = (rng) => {
  const a = int(rng, 2, 7);
  const b = int(rng, 1, 15);
  const t = int(rng, -3, 9);
  const c = a * t - b;
  const ok = t + int(rng, 1, 4);
  const bad = [t, t - 1, t - int(rng, 2, 5)];
  const { choices, answer } = mcq(rng, `${ok}`, bad.map(String), () => `${t - int(rng, 6, 9)}`);
  return M({
    skill: "Linear inequalities",
    difficulty: "EASY",
    type: "MCQ",
    stem: `Which of the following values of $x$ satisfies the inequality $${a}x - ${b} > ${c}$?`,
    choices,
    answer,
    explanation: `Add ${b} to both sides: $${a}x > ${c + b}$. Divide by ${a}: $x > ${t}$. Only ${ok} is greater than ${t}.`,
  });
};

const inequalityWord: Gen = (rng) => {
  const budget = pick(rng, [150, 200, 250, 300, 400]);
  const fixed = pick(rng, [20, 25, 35, 40, 55]);
  const price = pick(rng, [6, 7, 8, 9, 12, 14]);
  const max = Math.floor((budget - fixed) / price);
  return M({
    skill: "Linear inequalities",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `A club has at most ${money(budget)} to spend on a trip. The bus costs ${money(fixed)}, and each museum ticket costs ${money(price)}. What is the maximum number of tickets the club can buy?`,
    answer: `${max}`,
    explanation: `Let $t$ be the number of tickets: $${fixed} + ${price}t \\le ${budget}$, so $t \\le ${budget - fixed}/${price} \\approx ${((budget - fixed) / price).toFixed(2)}$. Since $t$ must be a whole number, the maximum is ${max}.`,
  });
};

// ─── Advanced math ──────────────────────────────────────────────────────────

const quadraticEval: Gen = (rng) => {
  const a = nonZero(rng, -3, 4);
  const b = int(rng, -6, 6);
  const c = int(rng, -10, 10);
  const k = nonZero(rng, -4, 4);
  const v = a * k * k + b * k + c;
  return M({
    skill: "Nonlinear functions",
    difficulty: "EASY",
    type: "SPR",
    stem: `The function $g$ is defined by $g(x) = ${coef(a, "x^2")} ${b === 0 ? "" : `${b < 0 ? "-" : "+"} ${coef(Math.abs(b), "x")}`} ${sgn(c)}$. What is the value of $g(${k})$?`,
    answer: `${v}`,
    explanation: `$g(${k}) = ${a}(${k})^2 ${b < 0 ? "-" : "+"} ${Math.abs(b)}(${k}) ${sgn(c)} = ${a * k * k} ${sgn(b * k)} ${sgn(c)} = ${v}$.`,
  });
};

const exponentialModel: Gen = (rng) => {
  const p0 = pick(rng, [200, 300, 500, 800, 1200]);
  const h = pick(rng, [2, 3, 4, 5, 6]);
  const f = (s: string) => `$P(t) = ${s}$`;
  const correct = f(`${p0}(2)^{t/${h}}`);
  const { choices, answer } = mcq(rng, correct, [f(`${p0}(2)^{${h}t}`), f(`${p0}(${h})^{t/2}`), f(`${p0} + 2^{t/${h}}`)], () => f(`${2 * p0}^{t/${h}}`));
  return M({
    skill: "Nonlinear functions",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `A lab culture starts with ${p0} bacteria, and the number of bacteria doubles every ${h} hours. Which function gives the number of bacteria, $P(t)$, after $t$ hours?`,
    choices,
    answer,
    explanation: `Doubling means the growth factor is 2. The population doubles once every ${h} hours, so after $t$ hours it has doubled $t/${h}$ times: ${correct}.`,
  });
};

const vertexMinimum: Gen = (rng) => {
  const h = nonZero(rng, -6, 6);
  const k = int(rng, -12, 10);
  const B = -2 * h;
  const C = h * h + k;
  return M({
    skill: "Nonlinear functions",
    difficulty: "HARD",
    type: "SPR",
    stem: `The function $f$ is defined by $f(x) = x^2 ${B < 0 ? "-" : "+"} ${Math.abs(B)}x ${sgn(C)}$. What is the minimum value of $f(x)$?`,
    answer: `${k}`,
    explanation: `Complete the square: $x^2 ${B < 0 ? "-" : "+"} ${Math.abs(B)}x ${sgn(C)} = (x ${sgn(-h)})^2 ${sgn(k)}$. A square is never negative, so the minimum occurs at $x = ${h}$ and equals $${k}$.`,
  });
};

const quadraticPositiveRoot: Gen = (rng) => {
  const r1 = -int(rng, 1, 9);
  const r2 = int(rng, 1, 11);
  const B = -(r1 + r2);
  const C = r1 * r2;
  return M({
    skill: "Nonlinear equations",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `What is the positive solution to the equation $x^2 ${B === 0 ? "" : `${B < 0 ? "-" : "+"} ${coef(Math.abs(B), "x")}`} ${sgn(C)} = 0$?`,
    answer: `${r2}`,
    explanation: `Factor: $(x ${sgn(-r1)})(x ${sgn(-r2)}) = 0$, so $x = ${r1}$ or $x = ${r2}$. The positive solution is ${r2}.`,
  });
};

const sumOfSolutions: Gen = (rng) => {
  const a = int(rng, 2, 6);
  const b = nonZero(rng, -15, 15);
  const c = -int(rng, 1, 20);
  const s = frac(-b, a);
  return M({
    skill: "Nonlinear equations",
    difficulty: "HARD",
    type: "SPR",
    stem: `What is the sum of the solutions to $${a}x^2 ${b < 0 ? "-" : "+"} ${coef(Math.abs(b), "x")} ${sgn(c)} = 0$?`,
    answer: s.text.includes("/") ? `${s.text}|${Number(s.value.toFixed(4))}` : s.text,
    explanation: `For $ax^2 + bx + c = 0$, the sum of the solutions is $-\\dfrac{b}{a}$. Here $a = ${a}$ and $b = ${b}$, so the sum is $${s.tex}$. (The discriminant is positive because $c < 0$, so two real solutions exist.)`,
  });
};

const discriminantOne: Gen = (rng) => {
  const half = nonZero(rng, -9, 9);
  const b = 2 * half;
  return M({
    skill: "Nonlinear equations",
    difficulty: "HARD",
    type: "SPR",
    stem: `In the equation $x^2 ${b < 0 ? "-" : "+"} ${Math.abs(b)}x + c = 0$, $c$ is a constant. If the equation has exactly one real solution, what is the value of $c$?`,
    answer: `${half * half}`,
    explanation: `A quadratic has exactly one real solution when its discriminant is zero: $b^2 - 4ac = ${b * b} - 4c = 0$, so $c = ${half * half}$.`,
  });
};

const expandProduct: Gen = (rng) => {
  const a = int(rng, 1, 5);
  const b = nonZero(rng, -7, 7);
  const c = int(rng, 1, 4);
  const d = nonZero(rng, -7, 7);
  const poly = (p: number, q: number, r: number) =>
    `$${coef(p, "x^2")} ${q === 0 ? "" : `${q < 0 ? "-" : "+"} ${coef(Math.abs(q), "x")}`} ${sgn(r)}$`;
  const correct = poly(a * c, a * d + b * c, b * d);
  const { choices, answer } = mcq(
    rng,
    correct,
    [poly(a * c, a * d - b * c, b * d), poly(a * c, a * d + b * c, -b * d), poly(a * c, b + d, b * d)],
    () => poly(a * c + 1, a * d + b * c, b * d),
  );
  return M({
    skill: "Equivalent expressions",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `Which expression is equivalent to $(${coef(a, "x")} ${sgn(b)})(${coef(c, "x")} ${sgn(d)})$?`,
    choices,
    answer,
    explanation: `Distribute (FOIL): $${a * c}x^2 ${sgn(a * d)}x ${sgn(b * c)}x ${sgn(b * d)}$. Combine like terms: ${correct}.`,
  });
};

const exponentRules: Gen = (rng) => {
  const a = int(rng, 2, 9);
  const b = int(rng, 2, 9);
  const c = int(rng, 1, a + b - 1);
  return M({
    skill: "Equivalent expressions",
    difficulty: "EASY",
    type: "SPR",
    stem: `If $\\dfrac{x^{${a}} \\cdot x^{${b}}}{x^{${c}}} = x^n$ for all $x > 0$, what is the value of $n$?`,
    answer: `${a + b - c}`,
    explanation: `Multiplying powers adds exponents and dividing subtracts them: $n = ${a} + ${b} - ${c} = ${a + b - c}$.`,
  });
};

// ─── Problem-solving and data analysis ──────────────────────────────────────

const recipeRatio: Gen = (rng) => {
  const cups = pick(rng, [2, 3, 4, 5]);
  const cookies = pick(rng, [12, 16, 18, 20, 24]);
  const mult = pick(rng, [2, 3, 4, 5]);
  return M({
    skill: "Ratios, rates, and proportions",
    difficulty: "EASY",
    type: "SPR",
    stem: `A recipe uses ${cups} cups of flour to make ${cookies} cookies. At this rate, how many cups of flour are needed to make ${cookies * mult} cookies?`,
    answer: `${cups * mult}`,
    explanation: `${cookies * mult} cookies is ${mult} times as many as ${cookies}, so the flour is multiplied by ${mult}: $${cups} \\times ${mult} = ${cups * mult}$ cups.`,
  });
};

const unitRate: Gen = (rng) => {
  const speed = pick(rng, [45, 50, 60, 64, 72, 80]);
  const t1 = pick(rng, [2, 3, 4]);
  const t2 = pick(rng, [5, 6, 7, 1.5, 2.5]);
  return M({
    skill: "Ratios, rates, and proportions",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `A train travels ${speed * t1} kilometers in ${t1} hours. At the same constant speed, how many kilometers will it travel in ${t2} hours?`,
    answer: `${speed * t2}`,
    explanation: `The speed is $${speed * t1} \\div ${t1} = ${speed}$ km per hour. In ${t2} hours: $${speed} \\times ${t2} = ${speed * t2}$ km.`,
  });
};

const speedConversion: Gen = (rng) => {
  const k = int(rng, 2, 8);
  const kmh = 18 * k;
  const correct = `${5 * k}`;
  const { choices, answer } = mcq(rng, correct, [`${kmh * 1000}`, `${Math.round(kmh / 60)}`, `${(kmh * 3.6).toFixed(0)}`], () => `${5 * k + 3}`);
  return M({
    skill: "Ratios, rates, and proportions",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `A cyclist rides at a constant speed of ${kmh} kilometers per hour. What is this speed in meters per second? (1 kilometer = 1,000 meters)`,
    choices,
    answer,
    explanation: `$${kmh}\\ \\tfrac{\\text{km}}{\\text{h}} \\times \\tfrac{1000\\ \\text{m}}{1\\ \\text{km}} \\times \\tfrac{1\\ \\text{h}}{3600\\ \\text{s}} = \\tfrac{${kmh * 1000}}{3600} = ${5 * k}$ m/s.`,
  });
};

const percentIncrease: Gen = (rng) => {
  const base = pick(rng, [40, 60, 80, 120, 160, 200, 240]);
  const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 60]);
  const next = (base * (100 + p)) / 100;
  return M({
    skill: "Percentages",
    difficulty: "EASY",
    type: "SPR",
    stem: `The number of students in a chess club increased from ${base} to ${next}. By what percent did the number of students increase?`,
    answer: `${p}`,
    explanation: `Percent increase $= \\dfrac{${next} - ${base}}{${base}} \\times 100 = \\dfrac{${next - base}}{${base}} \\times 100 = ${p}\\%$.`,
  });
};

const discountTax: Gen = (rng) => {
  const price = pick(rng, [40, 60, 80, 120, 150, 200, 250]);
  const d = pick(rng, [10, 20, 25, 30, 40]);
  const t = pick(rng, [5, 8, 10, 12, 15]);
  const sale = r2(price * (1 - d / 100));
  const final = r2(sale * (1 + t / 100));
  const fmt = (n: number) => money(r2(n));
  const correct = fmt(final);
  const { choices, answer } = mcq(
    rng,
    correct,
    [fmt(price * (1 - (d - t) / 100)), fmt(price * (1 - d / 100)), fmt(price * (1 + t / 100) - d)],
    () => fmt(final + 5),
  );
  return M({
    skill: "Percentages",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `A jacket originally priced at ${money(price)} is on sale for ${d}% off. A sales tax of ${t}% is then applied to the sale price. What is the final cost of the jacket?`,
    choices,
    answer,
    explanation: `Sale price: $${price} \\times ${r2(1 - d / 100)} = ${sale}$. With tax: $${sale} \\times ${r2(1 + t / 100)} = ${final.toFixed(2)}$. The two percentages are applied one after the other, so they cannot simply be added or subtracted.`,
  });
};

const percentOf: Gen = (rng) => {
  const p = pick(rng, [12, 15, 24, 35, 45, 60, 75]);
  const n = pick(rng, [20, 40, 60, 80, 120, 200, 240]);
  return M({
    skill: "Percentages",
    difficulty: "EASY",
    type: "SPR",
    stem: `What is ${p}% of ${n}?`,
    answer: `${Number(((p * n) / 100).toFixed(2))}`,
    explanation: `$${p}\\% \\times ${n} = ${p / 100} \\times ${n} = ${Number(((p * n) / 100).toFixed(2))}$.`,
  });
};

const newMean: Gen = (rng) => {
  let n = 0, newMeanValue = 0, m = 0, x = -1;
  while (x < 0 || x > 100 || x === m) {
    n = int(rng, 4, 9);
    newMeanValue = int(rng, 60, 90);
    m = newMeanValue + int(rng, -5, 5);
    x = newMeanValue * (n + 1) - n * m;
  }
  return M({
    skill: "One-variable data",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `The mean score of ${n} students on a quiz was ${m}. When a new student's score of ${x} is included, what is the mean score of all ${n + 1} students?`,
    answer: `${newMeanValue}`,
    explanation: `The original total is $${n} \\times ${m} = ${n * m}$. Adding ${x} gives ${n * m + x}. The new mean is $${n * m + x} \\div ${n + 1} = ${newMeanValue}$.`,
  });
};

const median: Gen = (rng) => {
  const len = pick(rng, [7, 8]);
  const values = Array.from({ length: len }, () => int(rng, 3, 40));
  const sorted = [...values].sort((a, b) => a - b);
  const med = len % 2 ? sorted[(len - 1) / 2] : (sorted[len / 2 - 1] + sorted[len / 2]) / 2;
  return M({
    skill: "One-variable data",
    difficulty: "EASY",
    type: "SPR",
    stem: `What is the median of the data set below?\n\n${values.join(", ")}`,
    answer: `${med}`,
    explanation: `Order the values: ${sorted.join(", ")}. ${len % 2 ? `The middle (4th) value is ${med}.` : `With 8 values, the median is the mean of the 4th and 5th values: $(${sorted[3]} + ${sorted[4]})/2 = ${med}$.`}`,
  });
};

const probabilityTable: Gen = (rng) => {
  const a = int(rng, 8, 30), b = int(rng, 8, 30), c = int(rng, 8, 30), d = int(rng, 8, 30);
  const row = pick(rng, ["10th grade", "11th grade"] as const);
  const yes = row === "10th grade" ? a : c;
  const rowTotal = row === "10th grade" ? a + b : c + d;
  const p = frac(yes, rowTotal);
  return M({
    skill: "Probability",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `The table shows whether students in two grades joined a science club.\n\n| | Joined | Did not join | Total |\n|---|---|---|---|\n| 10th grade | ${a} | ${b} | ${a + b} |\n| 11th grade | ${c} | ${d} | ${c + d} |\n| Total | ${a + c} | ${b + d} | ${a + b + c + d} |\n\nIf one ${row} student is selected at random, what is the probability that the student joined the science club?`,
    answer: [p.text, `${Number(p.value.toFixed(4))}`, `${yes}/${rowTotal}`].filter((v, i, a) => a.indexOf(v) === i).join("|"),
    explanation: `Only ${row} students are considered, so the denominator is ${rowTotal}. Of these, ${yes} joined: $\\dfrac{${yes}}{${rowTotal}}${p.text !== `${yes}/${rowTotal}` ? ` = ${p.tex}` : ""}$.`,
  });
};

const bestFitPredict: Gen = (rng) => {
  const m = pick(rng, [1.5, 2.5, 3, 4.2, 0.8]);
  const b = pick(rng, [12, 20, 35, 48]);
  const x = pick(rng, [10, 20, 30, 40]);
  return M({
    skill: "Two-variable data",
    difficulty: "EASY",
    type: "SPR",
    stem: `A scatterplot of hours studied, $x$, and practice-test improvement in points, $y$, for a group of students is modeled by the line of best fit $y = ${m}x + ${b}$. According to the model, what is the predicted improvement for a student who studied ${x} hours?`,
    answer: `${Number((m * x + b).toFixed(2))}`,
    explanation: `Substitute $x = ${x}$: $y = ${m}(${x}) + ${b} = ${Number((m * x).toFixed(2))} + ${b} = ${Number((m * x + b).toFixed(2))}$.`,
  });
};

const bestFitSlopeMeaning: Gen = (rng) => {
  const m = pick(rng, [2.4, 3.5, 1.8, 5.2]);
  const b = pick(rng, [18, 24, 31]);
  const correct = `Each additional week of practice is associated with an increase of about ${m} words per minute.`;
  const { choices, answer } = mcq(
    rng,
    correct,
    [
      `A student who has not practiced types about ${m} words per minute.`,
      `Each additional word per minute requires about ${m} more weeks of practice.`,
      `Students type about ${b} more words per minute each week.`,
    ],
    () => `Typing speed doubles every ${m} weeks.`,
  );
  return M({
    skill: "Two-variable data",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `A teacher models typing speed $s$, in words per minute, after $w$ weeks of practice with the equation $s = ${m}w + ${b}$. What is the best interpretation of ${m} in this context?`,
    choices,
    answer,
    explanation: `In a linear model, the coefficient of the input variable is the rate of change: for each 1-week increase in $w$, $s$ increases by ${m}. The constant term is the predicted speed at $w = 0$.`,
  });
};

// ─── Geometry and trigonometry ──────────────────────────────────────────────

const prismVolume: Gen = (rng) => {
  const l = int(rng, 3, 12), w = int(rng, 2, 9), h = int(rng, 2, 10);
  return M({
    skill: "Area and volume",
    difficulty: "EASY",
    type: "SPR",
    stem: `A rectangular box has a length of ${l} centimeters, a width of ${w} centimeters, and a height of ${h} centimeters. What is the volume of the box, in cubic centimeters?`,
    answer: `${l * w * h}`,
    explanation: `$V = lwh = ${l} \\times ${w} \\times ${h} = ${l * w * h}$ cubic centimeters.`,
  });
};

const cylinderVolume: Gen = (rng) => {
  const r = int(rng, 2, 7), h = int(rng, 3, 12);
  const pi = (n: number) => `$${n}\\pi$`;
  const correct = pi(r * r * h);
  const { choices, answer } = mcq(rng, correct, [pi(2 * r * h), pi(r * h), pi(2 * r * r * h)], () => pi(r * r * h + r));
  return M({
    skill: "Area and volume",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `A right circular cylinder has a radius of ${r} inches and a height of ${h} inches. What is the volume of the cylinder, in cubic inches?`,
    choices,
    answer,
    explanation: `$V = \\pi r^2 h = \\pi (${r})^2 (${h}) = ${r * r * h}\\pi$.`,
  });
};

const scaleVolume: Gen = (rng) => {
  const k = pick(rng, [2, 3, 4]);
  return M({
    skill: "Area and volume",
    difficulty: "HARD",
    type: "SPR",
    stem: `Each edge of a cube is multiplied by ${k}. The volume of the new cube is how many times the volume of the original cube?`,
    answer: `${k ** 3}`,
    explanation: `Volume scales with the cube of the length factor: $${k}^3 = ${k ** 3}$.`,
  });
};

const triangleAngles: Gen = (rng) => {
  const a = int(rng, 25, 80), b = int(rng, 25, 70);
  return M({
    skill: "Lines, angles, and triangles",
    difficulty: "EASY",
    type: "SPR",
    stem: `In triangle $ABC$, the measure of angle $A$ is $${a}^\\circ$ and the measure of angle $B$ is $${b}^\\circ$. What is the measure, in degrees, of angle $C$?`,
    answer: `${180 - a - b}`,
    explanation: `The angles of a triangle sum to $180^\\circ$: $180 - ${a} - ${b} = ${180 - a - b}$.`,
  });
};

const parallelLines: Gen = (rng) => {
  const x = int(rng, 12, 30);
  const p = int(rng, 2, 4), q = p + int(rng, 1, 3);
  const r = int(rng, 5, 40);
  const s = (p - q) * x + r; // p*x + r = q*x + s
  const angle = p * x + r;
  if (angle >= 180 || angle <= 0) return parallelLines(rng);
  return M({
    skill: "Lines, angles, and triangles",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `Two parallel lines are cut by a transversal. A pair of corresponding angles have measures $(${p}x + ${r})^\\circ$ and $(${q}x ${sgn(s)})^\\circ$. What is the measure, in degrees, of each of these angles?`,
    answer: `${angle}`,
    explanation: `Corresponding angles formed by parallel lines are congruent: $${p}x + ${r} = ${q}x ${sgn(s)}$, so $x = ${x}$. Each angle measures $${p}(${x}) + ${r} = ${angle}^\\circ$.`,
  });
};

const similarTriangles: Gen = (rng) => {
  const a = int(rng, 3, 9), b = int(rng, 4, 12), k = pick(rng, [2, 3, 1.5, 2.5]);
  return M({
    skill: "Lines, angles, and triangles",
    difficulty: "MEDIUM",
    type: "SPR",
    stem: `Triangle $PQR$ is similar to triangle $XYZ$, where $P$, $Q$, and $R$ correspond to $X$, $Y$, and $Z$. If $PQ = ${a}$, $QR = ${b}$, and $XY = ${a * k}$, what is the length of $YZ$?`,
    answer: `${b * k}`,
    explanation: `The scale factor is $XY / PQ = ${a * k} / ${a} = ${k}$. So $YZ = ${k} \\times QR = ${k} \\times ${b} = ${b * k}$.`,
  });
};

const pythagorean: Gen = (rng) => {
  const [p, q, r] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]] as const);
  const k = int(rng, 1, 4);
  const askHyp = rng() < 0.5;
  return M({
    skill: "Right triangles and trigonometry",
    difficulty: "EASY",
    type: "SPR",
    stem: askHyp
      ? `A right triangle has legs of length ${p * k} and ${q * k}. What is the length of its hypotenuse?`
      : `A right triangle has a hypotenuse of length ${r * k} and one leg of length ${p * k}. What is the length of the other leg?`,
    answer: askHyp ? `${r * k}` : `${q * k}`,
    explanation: askHyp
      ? `$c = \\sqrt{${p * k}^2 + ${q * k}^2} = \\sqrt{${(p * k) ** 2 + (q * k) ** 2}} = ${r * k}$.`
      : `$b = \\sqrt{${r * k}^2 - ${p * k}^2} = \\sqrt{${(r * k) ** 2 - (p * k) ** 2}} = ${q * k}$.`,
  });
};

const trigRatio: Gen = (rng) => {
  const [p, q, r] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]] as const);
  const fn = pick(rng, ["sin", "cos", "tan"] as const);
  const value = fn === "sin" ? [p, r] : fn === "cos" ? [q, r] : [p, q];
  const f = (n: number, d: number) => `$\\dfrac{${n}}{${d}}$`;
  const correct = f(value[0], value[1]);
  const { choices, answer } = mcq(rng, correct, [f(p, r), f(q, r), f(p, q), f(q, p), f(r, p)], () => f(r, q));
  return M({
    skill: "Right triangles and trigonometry",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `In right triangle $ABC$, angle $C$ is the right angle, $BC = ${p}$, $AC = ${q}$, and $AB = ${r}$. What is the value of $\\${fn} A$?`,
    choices,
    answer,
    explanation: `Relative to angle $A$: the opposite side is $BC = ${p}$, the adjacent side is $AC = ${q}$, and the hypotenuse is $AB = ${r}$. ${fn === "sin" ? "Sine = opposite/hypotenuse" : fn === "cos" ? "Cosine = adjacent/hypotenuse" : "Tangent = opposite/adjacent"}, so $\\${fn} A = \\dfrac{${value[0]}}{${value[1]}}$.`,
  });
};

const circleRadius: Gen = (rng) => {
  const h = nonZero(rng, -6, 6), k = nonZero(rng, -6, 6), r = int(rng, 2, 9);
  const D = -2 * h, E = -2 * k, F = h * h + k * k - r * r;
  return M({
    skill: "Circles",
    difficulty: "HARD",
    type: "SPR",
    stem: `The equation of a circle in the $xy$-plane is $x^2 + y^2 ${D < 0 ? "-" : "+"} ${Math.abs(D)}x ${E < 0 ? "-" : "+"} ${Math.abs(E)}y ${sgn(F)} = 0$. What is the radius of the circle?`,
    answer: `${r}`,
    explanation: `Complete the square in $x$ and $y$: $(x ${sgn(-h)})^2 + (y ${sgn(-k)})^2 = ${h * h} + ${k * k} ${sgn(-F)} = ${r * r}$. So $r = \\sqrt{${r * r}} = ${r}$.`,
  });
};

const arcLength: Gen = (rng) => {
  const r = pick(rng, [6, 9, 12, 18]);
  const deg = pick(rng, [60, 90, 120, 30, 45]);
  const L = frac(deg * 2 * r, 360);
  const piTex = (t: string) => `$${t === "1" ? "" : t}\\pi$`;
  const correct = piTex(L.tex);
  const A = frac(deg * r * r, 360);
  const { choices, answer } = mcq(rng, correct, [piTex(A.tex), piTex(frac(deg * r, 360).tex), piTex(`${2 * r}`)], () => piTex(`${r}`));
  return M({
    skill: "Circles",
    difficulty: "HARD",
    type: "MCQ",
    stem: `A circle has a radius of ${r}. What is the length of an arc of the circle intercepted by a central angle of $${deg}^\\circ$?`,
    choices,
    answer,
    explanation: `Arc length $= \\dfrac{${deg}}{360} \\times 2\\pi(${r}) = ${L.tex}\\pi$.`,
  });
};

const circleCenter: Gen = (rng) => {
  const h = nonZero(rng, -8, 8), k = nonZero(rng, -8, 8), r = int(rng, 2, 10);
  const pt = (a: number, b: number) => `$(${a}, ${b})$`;
  const correct = pt(h, k);
  const { choices, answer } = mcq(rng, correct, [pt(-h, -k), pt(k, h), pt(h, -k)], () => pt(h + 1, k));
  return M({
    skill: "Circles",
    difficulty: "EASY",
    type: "MCQ",
    stem: `A circle in the $xy$-plane has equation $(x ${sgn(-h)})^2 + (y ${sgn(-k)})^2 = ${r * r}$. What are the coordinates of its center?`,
    choices,
    answer,
    explanation: `The form $(x - h)^2 + (y - k)^2 = r^2$ has center $(h, k)$, so the center is ${correct} and the radius is ${r}.`,
  });
};

export const MATH_GENERATORS: Gen[] = [
  linearOneVar,
  linearOneVarWord,
  linearFunctionEval,
  linearFunctionFromPoints,
  twoVarSlope,
  twoVarContext,
  systemSum,
  systemNoSolution,
  inequalityCheck,
  inequalityWord,
  quadraticEval,
  exponentialModel,
  vertexMinimum,
  quadraticPositiveRoot,
  sumOfSolutions,
  discriminantOne,
  expandProduct,
  exponentRules,
  recipeRatio,
  unitRate,
  speedConversion,
  percentIncrease,
  discountTax,
  percentOf,
  newMean,
  median,
  probabilityTable,
  bestFitPredict,
  bestFitSlopeMeaning,
  prismVolume,
  cylinderVolume,
  scaleVolume,
  triangleAngles,
  parallelLines,
  similarTriangles,
  pythagorean,
  trigRatio,
  circleRadius,
  arcLength,
  circleCenter,
];

export function generateMath(perGenerator: number, seed = 1600): GenQuestion[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  const out: GenQuestion[] = [];
  for (const gen of MATH_GENERATORS) {
    let made = 0;
    let tries = 0;
    while (made < perGenerator && tries++ < perGenerator * 6) {
      const q = gen(rng);
      if (seen.has(q.stem)) continue;
      seen.add(q.stem);
      out.push(q);
      made++;
    }
  }
  return out;
}
