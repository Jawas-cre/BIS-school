// Roadmap lessons, vocabulary decks, library resources and announcements.

export const ROADMAP: { title: string; section: "MATH" | "RW"; skill: string | null; summary: string; notes: string }[] = [
  {
    title: "How the Digital SAT works",
    section: "RW",
    skill: null,
    summary: "Structure, timing, adaptive modules and scoring — know the game before you play it.",
    notes: `## The test at a glance

| Section | Modules | Questions | Time |
|---|---|---|---|
| Reading & Writing | 2 | 27 + 27 | 32 + 32 min |
| Math | 2 | 22 + 22 | 35 + 35 min |

There is a **10-minute break** between the two sections. Each section is scored from **200 to 800**, for a total of **400–1600**.

## Adaptive modules
The second module of each section adapts to your performance on the first. A strong first module unlocks a harder second module — and a higher possible score. **Accuracy in module 1 matters most.**

## Strategy essentials
- There is no penalty for wrong answers: **never leave a question blank**.
- Use *Mark for Review* and come back — every question in a module is worth the same.
- In Math, a built-in graphing calculator is available for the whole section.
- Reading & Writing questions are short: one passage, one question.

> Your goal on this roadmap: master one skill at a time, then prove it in the unit quiz.`,
  },
  {
    title: "Linear equations in one variable",
    section: "MATH",
    skill: "Linear equations in one variable",
    summary: "Isolate the variable with inverse operations — the foundation of SAT algebra.",
    notes: `## Core idea
Undo operations in reverse order. Whatever you do to one side, do to the other.

**Example.** Solve $5x - 7 = 3x + 9$.

1. Subtract $3x$: $2x - 7 = 9$
2. Add $7$: $2x = 16$
3. Divide by $2$: $x = 8$

## Word problems
Translate first, then solve:
- "a fee of 40 plus 15 per month" → $40 + 15m$
- "is" → $=$

## Watch out
- Distribute negatives carefully: $-(x - 3) = -x + 3$.
- If both sides simplify to the same expression, there are **infinitely many** solutions; if they contradict (e.g. $3 = 5$), there are **none**.`,
  },
  {
    title: "Words in Context",
    section: "RW",
    skill: "Words in Context",
    summary: "Predict the word before you look at the choices.",
    notes: `## The method
1. **Cover the choices.** Read the text and find the clues around the blank.
2. **Predict** a simple word of your own.
3. **Match** your prediction to the choice with the closest meaning.

## Clue words
- *Although, however, unlike* → the blank **contrasts** with something nearby.
- *Because, so, therefore* → the blank **agrees** with the cause or effect.
- A colon or semicolon often introduces an **explanation** of the blank.

## Example
> Although critics predicted the museum would attract few visitors, attendance proved ______, exceeding the city's most hopeful estimates.

"Although" signals contrast with *few visitors*, and "exceeding estimates" means strong → **robust**.

Keep a notebook of new words from every practice set — the Vocabulary section will help you review them.`,
  },
  {
    title: "Linear functions",
    section: "MATH",
    skill: "Linear functions",
    summary: "Slope, intercept and what they mean in context.",
    notes: `## Slope-intercept form
$f(x) = mx + b$ — $m$ is the **rate of change**, $b$ is the **starting value** (the output when $x = 0$).

**Slope from two points:** $m = \\dfrac{y_2 - y_1}{x_2 - x_1}$

**Example.** $f(1) = 5$ and $f(4) = 14$. Then $m = \\dfrac{14 - 5}{4 - 1} = 3$ and $5 = 3(1) + b$, so $b = 2$: $f(x) = 3x + 2$.

## In context
If $C(h) = 25h + 40$ is the cost of a repair taking $h$ hours:
- $25$ = cost **per hour**
- $40$ = fixed cost (at $h = 0$)`,
  },
  {
    title: "Boundaries: punctuation",
    section: "RW",
    skill: "Boundaries",
    summary: "Periods, semicolons, colons and commas — when each one is allowed.",
    notes: `## Independent clauses (complete sentences)
Join two of them with:
- a period **.**
- a semicolon **;**
- a comma + FANBOYS (**, and / , but / , so** …)

A comma alone between two complete sentences is a **comma splice** — always wrong.

## Colons
Use a colon only after a **complete sentence** to introduce a list, an explanation or an example.
- ✅ The kit had three tools: a map, a compass, and a radio.
- ❌ The kit had: a map, a compass, and a radio.

## Never separate
- a subject from its verb (*The dish required*, not *The dish, required*)
- a verb from its object
- an essential name: *The chemist Rosalind Franklin helped…*`,
  },
  {
    title: "Systems of linear equations",
    section: "MATH",
    skill: "Systems of linear equations",
    summary: "Substitution, elimination, and the no-solution / infinite-solution shortcuts.",
    notes: `## Elimination
Line up the variables and add or subtract equations to cancel one variable.

$$
\\begin{aligned} 3x + 2y &= 16 \\\\ x - 2y &= 0 \\end{aligned}
$$

Adding gives $4x = 16$, so $x = 4$ and $y = 2$.

## Special cases
For $ax + by = c$ and $dx + ey = f$:
- **No solution:** $\\dfrac{a}{d} = \\dfrac{b}{e} \\ne \\dfrac{c}{f}$ (parallel lines)
- **Infinitely many:** $\\dfrac{a}{d} = \\dfrac{b}{e} = \\dfrac{c}{f}$ (same line)

## Speed tip
If a question asks for $x + y$ or $x - y$, try adding or subtracting the equations directly — you may not need $x$ and $y$ separately.`,
  },
  {
    title: "Transitions",
    section: "RW",
    skill: "Transitions",
    summary: "Identify the relationship between two ideas, then pick the word that signals it.",
    notes: `## Four relationships

| Relationship | Transitions |
|---|---|
| Contrast | however, by contrast, nevertheless, still |
| Cause → effect | therefore, as a result, consequently, thus |
| Addition | moreover, furthermore, additionally |
| Example / detail | for example, for instance, specifically |

## Method
1. Read the sentence **before** and **after** the blank.
2. Ask: does the second **oppose**, **result from**, **add to**, or **illustrate** the first?
3. Eliminate every choice in the wrong category — usually three of them.`,
  },
  {
    title: "Percentages",
    section: "MATH",
    skill: "Percentages",
    summary: "Percent of, percent change, and successive percentages.",
    notes: `## Multipliers are your friend
- Increase by $p\\%$ → multiply by $\\left(1 + \\tfrac{p}{100}\\right)$
- Decrease by $p\\%$ → multiply by $\\left(1 - \\tfrac{p}{100}\\right)$

**Percent change** $= \\dfrac{\\text{new} - \\text{old}}{\\text{old}} \\times 100$

## Successive changes
A 20% discount followed by 10% tax: $P \\times 0.8 \\times 1.1 = 0.88P$. That is **not** the same as a 10% discount.

## Reverse percentages
After a 25% increase the price is 150. Original: $150 \\div 1.25 = 120$.`,
  },
  {
    title: "Form, Structure, and Sense",
    section: "RW",
    skill: "Form, Structure, and Sense",
    summary: "Subject–verb agreement, verb tense, pronouns and possessives.",
    notes: `## Find the real subject
Cross out prepositional phrases: *The collection ~~of rare manuscripts~~ **is** on display.*

- *Each, every, either, neither* → singular
- *Neither A nor B* → verb agrees with **B** (the nearer subject)

## Tense
Look for time clues: *last year* → past; *by the time … arrived* → past perfect (*had waited*).

## Possessives
| | Singular | Plural |
|---|---|---|
| Noun | the scientist's | the scientists' |
| Pronoun | its | their |

**it's** = *it is*. It is never possessive.`,
  },
  {
    title: "Quadratics and nonlinear equations",
    section: "MATH",
    skill: "Nonlinear equations",
    summary: "Factoring, the quadratic formula and the discriminant.",
    notes: `## Factoring
$x^2 - 5x - 14 = 0 \\Rightarrow (x - 7)(x + 2) = 0 \\Rightarrow x = 7$ or $x = -2$.

## Quadratic formula
$x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

## The discriminant $D = b^2 - 4ac$
- $D > 0$: two real solutions
- $D = 0$: exactly one real solution
- $D < 0$: no real solutions

## Shortcuts
- Sum of solutions $= -\\dfrac{b}{a}$
- Product of solutions $= \\dfrac{c}{a}$`,
  },
  {
    title: "Central Ideas and Details",
    section: "RW",
    skill: "Central Ideas and Details",
    summary: "Summarise the whole text, not just one sentence of it.",
    notes: `## Main idea questions
The right answer covers the **whole text**. Wrong answers are usually:
- **Too narrow** — true, but only about one detail
- **Too broad** — goes beyond what the text says
- **Distorted** — uses words from the text but changes the meaning

## Method
After reading, summarise the text in **one sentence of your own** before looking at the choices.

## Detail questions
The answer is **stated in the text**. Find the line that proves it — if you can't point to it, it's not the answer.`,
  },
  {
    title: "Right triangles and trigonometry",
    section: "MATH",
    skill: "Right triangles and trigonometry",
    summary: "Pythagorean theorem, special triangles and SOH-CAH-TOA.",
    notes: `## Pythagorean theorem
$a^2 + b^2 = c^2$. Memorise common triples: **3-4-5, 5-12-13, 8-15-17, 7-24-25** (and their multiples).

## SOH-CAH-TOA
- $\\sin \\theta = \\dfrac{\\text{opposite}}{\\text{hypotenuse}}$
- $\\cos \\theta = \\dfrac{\\text{adjacent}}{\\text{hypotenuse}}$
- $\\tan \\theta = \\dfrac{\\text{opposite}}{\\text{adjacent}}$

## Complementary angles
In a right triangle, $\\sin A = \\cos B$ when $A + B = 90^\\circ$.

## Special right triangles (on the reference sheet)
- $45$-$45$-$90$: sides $x, x, x\\sqrt{2}$
- $30$-$60$-$90$: sides $x, x\\sqrt{3}, 2x$`,
  },
  {
    title: "Command of Evidence",
    section: "RW",
    skill: "Command of Evidence",
    summary: "Support claims with quotations and data from tables and graphs.",
    notes: `## Textual evidence
1. Identify **exactly** what the claim says.
2. Pick the quotation or finding that proves **that** claim — not just a related one.

## Quantitative evidence (tables & graphs)
- Read the title, labels and units first.
- The right answer must be **accurate** *and* **relevant** to the claim.
- If the claim compares two things, the answer must mention both.

> Trap: a choice that correctly reads the table but doesn't support the claim.`,
  },
  {
    title: "Circles",
    section: "MATH",
    skill: "Circles",
    summary: "Circle equations, arc length, sector area and radians.",
    notes: `## Equation of a circle
$(x - h)^2 + (y - k)^2 = r^2$ — center $(h, k)$, radius $r$.

If the equation is expanded, **complete the square** in $x$ and $y$.

## Arcs and sectors
- Arc length $= \\dfrac{\\theta}{360} \\cdot 2\\pi r$
- Sector area $= \\dfrac{\\theta}{360} \\cdot \\pi r^2$

## Radians
$180^\\circ = \\pi$ radians. Arc length in radians: $s = r\\theta$.`,
  },
  {
    title: "Rhetorical Synthesis",
    section: "RW",
    skill: "Rhetorical Synthesis",
    summary: "Read the goal first — then pick the choice that achieves it.",
    notes: `## The one rule
These questions give you a set of notes and a **goal**. Read the goal **first**. The correct answer is the one that accomplishes that goal — even if other choices are accurate.

## Common goals
- **Emphasize a similarity / difference** → the answer must mention both things.
- **Introduce** a person or work to a new audience → include who/what and why it matters.
- **Explain a cause** → the answer must link cause and effect.

Accurate but off-goal choices are the most common trap.`,
  },
  {
    title: "Equivalent expressions",
    section: "MATH",
    skill: "Equivalent expressions",
    summary: "Exponent rules, distribution and factoring patterns.",
    notes: `## Exponent rules
- $x^a \\cdot x^b = x^{a+b}$
- $\\dfrac{x^a}{x^b} = x^{a-b}$
- $(x^a)^b = x^{ab}$
- $x^{1/n} = \\sqrt[n]{x}$

## Patterns to recognise
- $a^2 - b^2 = (a - b)(a + b)$
- $(a + b)^2 = a^2 + 2ab + b^2$

## Checking equivalence
Plug in a simple number (like $x = 2$) into the original and each choice — the equivalent expression gives the same value.`,
  },
];

export const VOCAB_DECKS: { title: string; description: string; level: string; words: [string, string, string, string, string][] }[] = [
  {
    title: "Core SAT Words",
    description: "High-frequency words that appear across Reading & Writing passages.",
    level: "Core",
    words: [
      ["abundant", "adj.", "existing in large quantities; plentiful", "Rainfall was abundant that spring, and the rivers ran high.", "plentiful, ample"],
      ["advocate", "v.", "to publicly support or recommend", "The doctor advocates daily exercise for all her patients.", "champion, promote"],
      ["ambiguous", "adj.", "open to more than one interpretation", "The ending of the film is ambiguous, leaving viewers to decide.", "unclear, vague"],
      ["anomaly", "n.", "something that deviates from what is normal", "The warm day in January was an anomaly.", "irregularity, oddity"],
      ["assert", "v.", "to state a fact or belief confidently", "The author asserts that cities must plant more trees.", "declare, claim"],
      ["bolster", "v.", "to support or strengthen", "New data bolstered the scientists' theory.", "reinforce, boost"],
      ["concise", "adj.", "giving much information clearly in few words", "Her concise summary fit on a single page.", "brief, succinct"],
      ["contend", "v.", "to assert something as a position in an argument", "Critics contend that the plan is too expensive.", "argue, maintain"],
      ["corroborate", "v.", "to confirm or give support to a statement or finding", "A second study corroborated the original results.", "confirm, verify"],
      ["credible", "adj.", "able to be believed; convincing", "An eyewitness account is usually a credible source.", "believable, reliable"],
      ["daunting", "adj.", "seeming difficult to deal with", "Writing a novel can be a daunting task.", "intimidating, formidable"],
      ["deter", "v.", "to discourage someone from doing something", "High fences deter deer from entering the garden.", "discourage, prevent"],
      ["diminish", "v.", "to make or become less", "The pain diminished after a few hours.", "decrease, lessen"],
      ["discern", "v.", "to perceive or recognize something", "She could barely discern the path in the fog.", "detect, distinguish"],
      ["empirical", "adj.", "based on observation or experiment", "The theory lacks empirical evidence.", "observed, experimental"],
      ["feasible", "adj.", "possible to do easily or conveniently", "Building the bridge in one year is not feasible.", "practical, achievable"],
      ["fleeting", "adj.", "lasting for a very short time", "He caught a fleeting glimpse of the fox.", "brief, momentary"],
      ["hinder", "v.", "to create difficulties that slow progress", "Heavy snow hindered the rescue effort.", "impede, obstruct"],
      ["inevitable", "adj.", "certain to happen; unavoidable", "Change is inevitable in any growing city.", "unavoidable, certain"],
      ["meticulous", "adj.", "showing great attention to detail", "The restorer was meticulous with every brushstroke.", "careful, precise"],
      ["mitigate", "v.", "to make less severe or painful", "Trees can mitigate the effects of urban heat.", "alleviate, reduce"],
      ["novel", "adj.", "new or unusual in an interesting way", "The team proposed a novel solution to the problem.", "innovative, original"],
      ["plausible", "adj.", "seeming reasonable or probable", "Her explanation was plausible but unproven.", "believable, likely"],
      ["pragmatic", "adj.", "dealing with things sensibly and realistically", "A pragmatic approach focuses on what works.", "practical, realistic"],
      ["prevalent", "adj.", "widespread in a particular area or time", "Smartphone use is prevalent among teenagers.", "common, widespread"],
      ["robust", "adj.", "strong and healthy; vigorous", "The economy showed robust growth this year.", "strong, sturdy"],
      ["scarce", "adj.", "insufficient for the demand", "Water becomes scarce during a drought.", "rare, limited"],
      ["skeptical", "adj.", "not easily convinced; having doubts", "Scientists were skeptical of the bold claim.", "doubtful, questioning"],
      ["undermine", "v.", "to weaken gradually or secretly", "Constant criticism can undermine confidence.", "weaken, erode"],
      ["viable", "adj.", "capable of working successfully", "Solar power is a viable energy source for the region.", "workable, feasible"],
    ],
  },
  {
    title: "Advanced Vocabulary",
    description: "Precise words that separate a 700 from a 750+ in Reading & Writing.",
    level: "Advanced",
    words: [
      ["alleviate", "v.", "to make suffering or a problem less severe", "The medicine alleviated her symptoms.", "ease, relieve"],
      ["arbitrary", "adj.", "based on random choice rather than reason", "The rules seemed arbitrary to the students.", "random, unreasoned"],
      ["candid", "adj.", "truthful and straightforward; frank", "He gave a candid account of his mistakes.", "frank, honest"],
      ["catalyst", "n.", "something that causes an important change", "The invention was a catalyst for the industrial boom.", "spark, stimulus"],
      ["circumvent", "v.", "to find a way around an obstacle", "Engineers circumvented the problem with a new design.", "bypass, avoid"],
      ["complacent", "adj.", "self-satisfied and unaware of possible danger", "Early success made the team complacent.", "smug, careless"],
      ["conciliatory", "adj.", "intended to make someone less angry", "She sent a conciliatory email after the argument.", "appeasing, peacemaking"],
      ["conspicuous", "adj.", "standing out so as to be clearly visible", "The red car was conspicuous in the parking lot.", "noticeable, obvious"],
      ["disparate", "adj.", "essentially different in kind", "The book connects disparate ideas from art and science.", "different, dissimilar"],
      ["elusive", "adj.", "difficult to find, catch or achieve", "A cure for the disease remains elusive.", "evasive, hard to pin down"],
      ["ephemeral", "adj.", "lasting a very short time", "Fashion trends are often ephemeral.", "short-lived, transient"],
      ["exacerbate", "v.", "to make a problem worse", "Stress can exacerbate headaches.", "worsen, aggravate"],
      ["galvanize", "v.", "to shock or excite someone into action", "The speech galvanized volunteers.", "stimulate, spur"],
      ["idiosyncratic", "adj.", "peculiar to an individual", "His idiosyncratic writing style is easy to recognize.", "distinctive, quirky"],
      ["incongruous", "adj.", "not in harmony with the surroundings", "A modern tower looked incongruous among old houses.", "out of place, inconsistent"],
      ["innocuous", "adj.", "not harmful or offensive", "The question seemed innocuous but caused a debate.", "harmless, inoffensive"],
      ["lucid", "adj.", "expressed clearly; easy to understand", "Her lucid explanation cleared up the confusion.", "clear, coherent"],
      ["mundane", "adj.", "lacking interest or excitement; dull", "He found the daily routine mundane.", "ordinary, routine"],
      ["nuanced", "adj.", "characterized by subtle distinctions", "The article offers a nuanced view of the debate.", "subtle, refined"],
      ["obsolete", "adj.", "no longer produced or used; out of date", "Typewriters became obsolete with computers.", "outdated, outmoded"],
      ["paradox", "n.", "a seemingly contradictory statement that may be true", "It is a paradox that the more we learn, the less we know.", "contradiction, puzzle"],
      ["proliferate", "v.", "to increase rapidly in number", "Coffee shops proliferated across the city.", "multiply, spread"],
      ["reticent", "adj.", "not revealing one's thoughts readily", "She was reticent about her plans.", "reserved, quiet"],
      ["scrutinize", "v.", "to examine closely and thoroughly", "The committee scrutinized every expense.", "inspect, examine"],
      ["tenuous", "adj.", "very weak or slight", "The link between the two events is tenuous.", "weak, flimsy"],
    ],
  },
  {
    title: "Transitions & Logic Words",
    description: "Signal words that show how ideas connect — essential for Transitions questions.",
    level: "Core",
    words: [
      ["consequently", "adv.", "as a result", "It rained all night; consequently, the match was cancelled.", "therefore, thus"],
      ["conversely", "adv.", "introducing a statement that reverses the previous one", "Some plants need sun; conversely, ferns prefer shade.", "on the other hand"],
      ["furthermore", "adv.", "in addition; besides", "The plan is cheap; furthermore, it is fast.", "moreover, also"],
      ["nevertheless", "adv.", "in spite of that", "The task was hard; nevertheless, they finished it.", "nonetheless, still"],
      ["likewise", "adv.", "in the same way; similarly", "Bees pollinate flowers; likewise, some bats do.", "similarly, equally"],
      ["hence", "adv.", "as a consequence; for this reason", "The ice was thin; hence, skating was forbidden.", "therefore, thus"],
      ["notably", "adv.", "especially; in particular", "Many cities, notably Tashkent, have grown rapidly.", "particularly, especially"],
      ["subsequently", "adv.", "after a particular thing has happened", "He moved to Paris and subsequently became a painter.", "later, afterwards"],
      ["whereas", "conj.", "in contrast or comparison with the fact that", "Some prefer tea, whereas others prefer coffee.", "while, although"],
      ["ultimately", "adv.", "finally; in the end", "Ultimately, the team chose the simpler design.", "eventually, finally"],
      ["similarly", "adv.", "in a similar way", "The two birds, similarly, migrate south in winter.", "likewise, in the same way"],
      ["regardless", "adv.", "despite the prevailing circumstances", "The show went on regardless of the rain.", "anyway, nonetheless"],
    ],
  },
];

export const LIBRARY = [
  { title: "Bluebook — official digital testing app", author: "College Board", category: "PRACTICE", url: "https://bluebook.collegeboard.org/", description: "Download the official app to take full-length adaptive practice tests exactly as on test day." },
  { title: "SAT Practice and Preparation", author: "College Board", category: "PRACTICE", url: "https://satsuite.collegeboard.org/sat/practice-preparation", description: "Official practice tests, sample questions and study resources for the Digital SAT." },
  { title: "Digital SAT course", author: "Khan Academy", category: "VIDEO", url: "https://www.khanacademy.org/test-prep/digital-sat", description: "Free official lessons and practice for every Reading & Writing and Math skill." },
  { title: "Desmos graphing calculator", author: "Desmos", category: "GUIDE", url: "https://www.desmos.com/calculator", description: "The same graphing calculator built into the Digital SAT. Practice with it until it's second nature." },
  { title: "BigFuture — college search & planning", author: "College Board", category: "GUIDE", url: "https://bigfuture.collegeboard.org/", description: "Explore colleges, careers and scholarships, and build your college list." },
  { title: "EducationUSA advising", author: "U.S. Department of State", category: "GUIDE", url: "https://educationusa.state.gov/", description: "Free official advising for international students planning to study in the United States." },
  { title: "Common App", author: "Common App", category: "GUIDE", url: "https://www.commonapp.org/", description: "Apply to 1,000+ colleges with one application — see essay prompts and deadlines." },
  { title: "SAT test dates and deadlines", author: "College Board", category: "GUIDE", url: "https://satsuite.collegeboard.org/sat/dates-deadlines", description: "Upcoming international test dates and registration deadlines." },
];

export const PLATFORM_NEWS = [
  {
    title: "Welcome to BIS Prep",
    tag: "Announcement",
    pinned: true,
    body: "BIS Prep brings everything you need for the Digital SAT into one place: a question bank with step-by-step explanations, timed mock tests with instant score reports, a roadmap with lessons that unlock topic by topic, a vocabulary trainer, a curated library, a guide to top universities, and an AI tutor.\n\nStart with the **Roadmap** — it tells you exactly what to study next.",
  },
  {
    title: "New: AI Assistant",
    tag: "Update",
    pinned: false,
    body: "Stuck on a question at midnight? The AI Assistant explains SAT concepts step by step, checks your reasoning and suggests what to practise next. You'll also find an **Ask AI** button under every explanation in the question bank.",
  },
  {
    title: "Tip: review your mistakes, not just your score",
    tag: "Tip",
    pinned: false,
    body: "After every mock test, open the score report and filter by **Incorrect**. For each mistake, write one sentence about *why* you missed it — a careless error, a content gap, or a timing problem. Patterns appear quickly, and fixing them is the fastest way to raise your score.",
  },
];
