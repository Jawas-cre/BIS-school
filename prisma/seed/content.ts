// Platform subjects, roadmap lessons, vocabulary decks, library resources and announcements.

export const SUBJECTS: { name: string; icon: string; color: string; description: string; topics: string[] }[] = [
  { name: "Mathematics", icon: "math", color: "#2563eb", description: "Algebra, functions, geometry, trigonometry and statistics.", topics: ["Linear equations", "Functions", "Quadratics & polynomials", "Ratios & percentages", "Statistics & probability", "Geometry", "Trigonometry"] },
  { name: "English", icon: "language", color: "#7c3aed", description: "Reading, vocabulary, grammar, punctuation and writing.", topics: ["Reading comprehension", "Vocabulary", "Linking words", "Punctuation", "Grammar", "Writing"] },
  { name: "Physics", icon: "physics", color: "#0891b2", description: "Motion, forces, energy, electricity, waves and matter.", topics: ["Motion", "Forces", "Energy & power", "Electricity", "Waves", "Matter"] },
  { name: "Chemistry", icon: "chemistry", color: "#ea580c", description: "Atoms, moles, solutions, the periodic table and reactions.", topics: ["Atomic structure", "Chemical formulas & moles", "Solutions", "Periodic table", "Reactions"] },
  { name: "Biology", icon: "biology", color: "#059669", description: "Cells, genetics, the human body, ecology and plants.", topics: ["Cells", "Genetics", "Human body", "Ecology", "Plants"] },
  { name: "History", icon: "history", color: "#b45309", description: "World history and the history of Central Asia.", topics: ["Ancient world", "Middle Ages", "Modern history", "History of Central Asia"] },
  { name: "Computer Science", icon: "code", color: "#db2777", description: "Binary and data, programming, algorithms and computer systems.", topics: ["Binary & data", "Programming basics", "Algorithms", "Computer systems"] },
];

type Unit = { subject: string; topic: string | null; title: string; summary: string; notes: string };

export const ROADMAP: Unit[] = [
  // ── Mathematics ──
  {
    subject: "Mathematics",
    topic: "Linear equations",
    title: "Linear equations",
    summary: "Isolate the variable with inverse operations — and solve systems of two equations.",
    notes: `## Solving one equation
Undo operations in reverse order. Whatever you do to one side, do to the other.

**Example.** Solve $5x - 7 = 3x + 9$.

1. Subtract $3x$: $2x - 7 = 9$
2. Add $7$: $2x = 16$
3. Divide by $2$: $x = 8$

## Systems of two equations
Line up the variables and add or subtract the equations to eliminate one of them.

$$
\\begin{aligned} 3x + 2y &= 16 \\\\ x - 2y &= 0 \\end{aligned}
$$

Adding gives $4x = 16$, so $x = 4$ and $y = 2$.

## Watch out
- Distribute negatives carefully: $-(x - 3) = -x + 3$.
- When you multiply or divide an **inequality** by a negative number, flip the sign.`,
  },
  {
    subject: "Mathematics",
    topic: "Functions",
    title: "Functions and graphs",
    summary: "Slope, intercepts, and reading linear and exponential models.",
    notes: `## Linear functions
$f(x) = mx + b$ — $m$ is the **rate of change** (slope), $b$ is the **starting value**.

**Slope from two points:** $m = \\dfrac{y_2 - y_1}{x_2 - x_1}$

**Example.** $f(1) = 5$ and $f(4) = 14$. Then $m = \\dfrac{14 - 5}{4 - 1} = 3$ and $b = 2$, so $f(x) = 3x + 2$.

## Exponential growth
If a quantity is multiplied by the same factor every period, use $P(t) = P_0 \\cdot r^{t}$. Doubling every $h$ hours: $P(t) = P_0 \\cdot 2^{t/h}$.

## Reading a model in context
In $C(h) = 25h + 40$, $25$ is the cost **per hour** and $40$ is the fixed cost.`,
  },
  {
    subject: "Mathematics",
    topic: "Quadratics & polynomials",
    title: "Quadratics",
    summary: "Expanding, factoring, the quadratic formula and the discriminant.",
    notes: `## Expanding and factoring
$(x + 3)(x - 5) = x^2 - 2x - 15$. Reverse it to factor: find two numbers that multiply to $-15$ and add to $-2$.

## Solving $ax^2 + bx + c = 0$
- Factor if you can: $x^2 - 5x - 14 = (x - 7)(x + 2) = 0 \\Rightarrow x = 7$ or $x = -2$.
- Otherwise use $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

## The discriminant $D = b^2 - 4ac$
$D > 0$: two real solutions · $D = 0$: one · $D < 0$: none.

## Useful facts
Sum of solutions $= -\\dfrac{b}{a}$, product $= \\dfrac{c}{a}$. The vertex of $y = a(x - h)^2 + k$ is $(h, k)$.`,
  },
  {
    subject: "Mathematics",
    topic: "Ratios & percentages",
    title: "Ratios and percentages",
    summary: "Proportions, unit rates, percent change and successive percentages.",
    notes: `## Proportions
If 4 cups of flour make 18 cookies, then 90 cookies need $4 \\times \\dfrac{90}{18} = 20$ cups.

## Percent multipliers
- Increase by $p\\%$: multiply by $\\left(1 + \\tfrac{p}{100}\\right)$
- Decrease by $p\\%$: multiply by $\\left(1 - \\tfrac{p}{100}\\right)$

**Percent change** $= \\dfrac{\\text{new} - \\text{old}}{\\text{old}} \\times 100$

## Successive changes
A 20% discount followed by 10% tax: $P \\times 0.8 \\times 1.1 = 0.88P$ — not the same as a 10% discount.`,
  },
  {
    subject: "Mathematics",
    topic: "Statistics & probability",
    title: "Statistics and probability",
    summary: "Mean, median, lines of best fit and probability from tables.",
    notes: `## Averages
- **Mean** = total ÷ number of values. Adding a value changes the total: new mean = (old total + new value) ÷ (n + 1).
- **Median** = the middle value once sorted (mean of the two middle values for an even count).

## Lines of best fit
In $y = 2.5x + 12$, the slope $2.5$ is the predicted change in $y$ for each extra unit of $x$.

## Probability from a table
$P(\\text{event}) = \\dfrac{\\text{favourable outcomes}}{\\text{total outcomes}}$. If the question says “a student **from grade 11**”, only grade-11 students go in the denominator.`,
  },
  {
    subject: "Mathematics",
    topic: "Geometry",
    title: "Geometry",
    summary: "Angles, triangles, similarity, area, volume and circles.",
    notes: `## Angles and triangles
- Angles in a triangle sum to $180^\\circ$.
- Parallel lines cut by a transversal make equal corresponding angles.
- Similar triangles have equal angles and proportional sides.

## Area and volume
Rectangle $A = \\ell w$ · Triangle $A = \\tfrac{1}{2}bh$ · Circle $A = \\pi r^2$ · Prism $V = \\ell w h$ · Cylinder $V = \\pi r^2 h$.

## Circles
$(x - h)^2 + (y - k)^2 = r^2$ has centre $(h, k)$ and radius $r$.
Arc length $= \\dfrac{\\theta}{360} \\cdot 2\\pi r$ · Sector area $= \\dfrac{\\theta}{360} \\cdot \\pi r^2$.`,
  },
  {
    subject: "Mathematics",
    topic: "Trigonometry",
    title: "Right triangles and trigonometry",
    summary: "Pythagoras and SOH-CAH-TOA.",
    notes: `## Pythagorean theorem
$a^2 + b^2 = c^2$. Common triples: **3-4-5, 5-12-13, 8-15-17, 7-24-25**.

## SOH-CAH-TOA
- $\\sin \\theta = \\dfrac{\\text{opposite}}{\\text{hypotenuse}}$
- $\\cos \\theta = \\dfrac{\\text{adjacent}}{\\text{hypotenuse}}$
- $\\tan \\theta = \\dfrac{\\text{opposite}}{\\text{adjacent}}$

Label the sides **from the angle you are using** before choosing a ratio.`,
  },
  // ── English ──
  {
    subject: "English",
    topic: "Reading comprehension",
    title: "Reading for the main idea",
    summary: "Summarise the whole text and support answers with evidence.",
    notes: `## Main idea
The main idea covers the **whole text**. Wrong answers are often:
- **Too narrow** — true, but only about one detail
- **Too broad** — goes beyond what the text says
- **Distorted** — uses words from the text but changes the meaning

## Method
1. Read the whole text once.
2. Summarise it in **one sentence of your own**.
3. Choose the option closest to your summary.

## Evidence
For detail and evidence questions, find the exact line that proves your answer. If you can't point to it, it isn't the answer.`,
  },
  {
    subject: "English",
    topic: "Vocabulary",
    title: "Words in context",
    summary: "Use clues in the sentence to choose the most precise word.",
    notes: `## The method
1. **Cover the options.** Read the sentence and find clues around the blank.
2. **Predict** a simple word of your own.
3. **Match** your prediction to the closest option.

## Clue words
- *Although, however, unlike* → the blank **contrasts** with something nearby.
- *Because, so, therefore* → the blank **agrees** with a cause or effect.
- A colon often introduces an **explanation** of the blank.

Keep a notebook of new words and review them in the Vocabulary section.`,
  },
  {
    subject: "English",
    topic: "Linking words",
    title: "Linking words and transitions",
    summary: "Show how ideas connect: contrast, cause, addition and example.",
    notes: `| Relationship | Linking words |
|---|---|
| Contrast | however, by contrast, nevertheless, still |
| Cause → effect | therefore, as a result, consequently, thus |
| Addition | moreover, furthermore, in addition |
| Example | for example, for instance, specifically |

Read the sentence **before** and **after** the gap and ask: does the second one oppose, result from, add to, or illustrate the first?`,
  },
  {
    subject: "English",
    topic: "Punctuation",
    title: "Punctuation",
    summary: "Full stops, semicolons, colons and commas — when each is allowed.",
    notes: `## Joining two complete sentences
Use a full stop, a semicolon, or a comma + *and / but / so*. A comma alone makes a **comma splice**.

## Colons
Use a colon after a **complete sentence** to introduce a list or explanation.
- ✅ The kit had three tools: a map, a compass and a radio.
- ❌ The kit had: a map, a compass and a radio.

## Never separate
A subject from its verb (*The dish required*, not *The dish, required*).`,
  },
  {
    subject: "English",
    topic: "Grammar",
    title: "Grammar essentials",
    summary: "Subject–verb agreement, tenses, pronouns and possessives.",
    notes: `## Find the real subject
*The collection ~~of rare manuscripts~~ **is** on display.*
*Each, every, either, neither* are singular.

## Tense
Time words decide the tense: *last year* → past; *by the time they arrived* → past perfect (*had waited*).

## Possessives
| | Singular | Plural |
|---|---|---|
| Noun | the student's | the students' |
| Pronoun | its | their |

**it's** = *it is* — never possessive.`,
  },
  {
    subject: "English",
    topic: "Writing",
    title: "Writing with a purpose",
    summary: "Choose the sentence that achieves the writer's goal.",
    notes: `Good writing starts with a **goal**. Before you write — or choose between options — ask what the sentence must do:

- **Introduce** a person or idea → say who or what, and why it matters.
- **Compare** → mention both things.
- **Explain a cause** → link the cause and the effect.

An accurate sentence that misses the goal is still the wrong choice.`,
  },
  // ── Physics ──
  {
    subject: "Physics",
    topic: "Motion",
    title: "Speed, velocity and acceleration",
    summary: "Describe motion with equations and graphs.",
    notes: `## Key equations
- speed $= \\dfrac{\\text{distance}}{\\text{time}}$
- acceleration $a = \\dfrac{v - u}{t}$
- from rest with constant acceleration: $s = \\tfrac{1}{2}at^2$

**Scalars** have size only (speed, distance, mass). **Vectors** also have direction (velocity, displacement, force).

## Graphs
On a distance–time graph the gradient is the speed; on a velocity–time graph the gradient is the acceleration and the area under the line is the distance travelled.`,
  },
  {
    subject: "Physics",
    topic: "Forces",
    title: "Forces and Newton's laws",
    summary: "Resultant force, weight, pressure and action–reaction pairs.",
    notes: `## Newton's laws
1. With no resultant force, an object stays at rest or keeps moving at constant velocity.
2. $F = ma$ — resultant force (N) = mass (kg) × acceleration (m/s²).
3. Forces come in equal and opposite pairs acting on **different** objects.

## Weight and pressure
- Weight $W = mg$ (on Earth $g \\approx 10$ N/kg)
- Pressure $p = \\dfrac{F}{A}$ in pascals (Pa)`,
  },
  {
    subject: "Physics",
    topic: "Energy & power",
    title: "Energy and power",
    summary: "Kinetic and potential energy, energy transfers and power.",
    notes: `- Kinetic energy $E_k = \\tfrac{1}{2}mv^2$
- Gravitational potential energy $E_p = mgh$
- Power $P = \\dfrac{E}{t}$ (watts = joules per second)

Energy is never created or destroyed — it is **transferred** between stores. A falling ball transfers $E_p$ into $E_k$; friction transfers energy to the thermal store.`,
  },
  {
    subject: "Physics",
    topic: "Electricity",
    title: "Electric circuits",
    summary: "Current, voltage, resistance and power in series and parallel.",
    notes: `## Ohm's law
$V = IR$ — voltage (V) = current (A) × resistance (Ω).

## Combining resistors
- Series: $R = R_1 + R_2 + \\dots$
- Two in parallel: $R = \\dfrac{R_1R_2}{R_1 + R_2}$ (always less than the smallest)

## Power
$P = VI$. In series the current is the same everywhere; in parallel the voltage across each branch is the same.`,
  },
  {
    subject: "Physics",
    topic: "Waves",
    title: "Waves",
    summary: "Frequency, wavelength, speed and period.",
    notes: `- Wave speed $v = f\\lambda$
- Period $T = \\dfrac{1}{f}$

**Transverse** waves (light, water ripples) oscillate at right angles to the direction of travel; **longitudinal** waves (sound) oscillate along it. Sound needs a medium, so it cannot travel through a vacuum.`,
  },
  // ── Chemistry ──
  {
    subject: "Chemistry",
    topic: "Atomic structure",
    title: "Atoms and bonding",
    summary: "Protons, neutrons, electrons, and ionic vs covalent bonds.",
    notes: `| Particle | Charge | Relative mass |
|---|---|---|
| Proton | +1 | 1 |
| Neutron | 0 | 1 |
| Electron | −1 | very small |

- Atomic number = protons (= electrons in a neutral atom)
- Neutrons = mass number − atomic number

**Ionic bonds** form between metals and non-metals (electron transfer); **covalent bonds** form between non-metals (shared electrons).`,
  },
  {
    subject: "Chemistry",
    topic: "Chemical formulas & moles",
    title: "The mole",
    summary: "Relative formula mass, moles and percentage composition.",
    notes: `## Relative formula mass
Add the relative atomic masses: $\\mathrm{H_2O} = 2(1) + 16 = 18$.

## Moles
$n = \\dfrac{m}{M}$ — moles = mass (g) ÷ molar mass (g/mol).

**Example.** 36 g of water: $n = 36 \\div 18 = 2$ mol.

## Percentage by mass
$\\dfrac{\\text{mass of element in formula}}{M_r} \\times 100$ — carbon in $\\mathrm{CO_2}$: $\\tfrac{12}{44} \\times 100 \\approx 27\\%$.`,
  },
  {
    subject: "Chemistry",
    topic: "Solutions",
    title: "Solutions, acids and pH",
    summary: "Concentration and the pH scale.",
    notes: `## Concentration
$c = \\dfrac{n}{V}$ in mol/L — always convert mL to L first (250 mL = 0.25 L).

## pH
- below 7: acidic · 7: neutral · above 7: alkaline
- Acid + alkali → salt + water (neutralisation)`,
  },
  {
    subject: "Chemistry",
    topic: "Periodic table",
    title: "The periodic table",
    summary: "Groups, periods and trends.",
    notes: `- **Groups** (columns) share the same number of outer electrons and similar reactions.
- Group 1: alkali metals · Group 7: halogens · Group 0/18: noble gases (unreactive).
- Across a period, atomic radius decreases; down a group, it increases.`,
  },
  // ── Biology ──
  {
    subject: "Biology",
    topic: "Cells",
    title: "Cells",
    summary: "Organelles, plant vs animal cells and transport.",
    notes: `| Structure | Job |
|---|---|
| Nucleus | contains DNA, controls the cell |
| Mitochondria | aerobic respiration |
| Ribosomes | make proteins |
| Cell membrane | controls what enters and leaves |
| Cell wall (plants) | support |
| Chloroplasts (plants) | photosynthesis |

**Diffusion** moves particles from high to low concentration; **osmosis** is the diffusion of water across a partially permeable membrane; **active transport** uses energy to move substances against a gradient.`,
  },
  {
    subject: "Biology",
    topic: "Genetics",
    title: "Genetics and inheritance",
    summary: "DNA, chromosomes and Punnett squares.",
    notes: `- DNA base pairs: **A–T** and **C–G**.
- Human body cells have 46 chromosomes; gametes have 23.
- A **dominant** allele (A) shows even with one copy; a **recessive** allele (a) only shows in aa.

**Punnett square for Aa × Aa:** AA, Aa, Aa, aa → 25% show the recessive trait.`,
  },
  {
    subject: "Biology",
    topic: "Human body",
    title: "The human body",
    summary: "Circulation, breathing, digestion and hormones.",
    notes: `- **Arteries** carry blood away from the heart; **veins** return it; **capillaries** exchange substances with cells.
- Gas exchange happens in the **alveoli** of the lungs.
- Digestive enzymes: amylase (starch), protease (proteins), lipase (fats).
- The pancreas releases **insulin**, which lowers blood glucose.`,
  },
  {
    subject: "Biology",
    topic: "Ecology",
    title: "Ecology",
    summary: "Food chains, energy transfer and ecosystems.",
    notes: `Producer → primary consumer → secondary consumer → tertiary consumer.

Only about **10%** of the energy at one level is passed to the next — the rest is used for life processes or lost as heat. That is why food chains rarely have more than four or five links.`,
  },
  // ── History ──
  {
    subject: "History",
    topic: "Ancient world",
    title: "Ancient civilizations",
    summary: "Mesopotamia, Egypt, Greece and Rome.",
    notes: `- **Mesopotamia** (Sumer): cuneiform writing, around 3200 BCE.
- **Egypt**: pharaohs and the pyramids of Giza (around 2560 BCE).
- **Greece**: city-states, democracy in Athens, Alexander the Great of Macedon.
- **Rome**: from republic to empire; roads, law and Latin.

When studying any civilization, ask: *Where? When? How did people live, govern and believe?*`,
  },
  {
    subject: "History",
    topic: "History of Central Asia",
    title: "Central Asia through the ages",
    summary: "The Silk Road, great scholars and the Timurids.",
    notes: `## The Silk Road
Trade routes linked China with the Mediterranean through Samarkand, Bukhara and Khiva, carrying goods, religions and ideas.

## Scholars
- **Al-Khwarizmi** — algebra; his name gave us “algorithm”.
- **Ibn Sina** — *The Canon of Medicine*.
- **Al-Biruni** — astronomy, geography and mathematics.

## The Timurids
**Amir Temur** founded the Timurid Empire (1370) with Samarkand as its capital; his grandson **Ulugh Beg** built a famous observatory. **Babur**, born in Andijan, founded the Mughal Empire in 1526.`,
  },
  {
    subject: "History",
    topic: "Modern history",
    title: "The modern world",
    summary: "Revolutions, world wars and the twentieth century.",
    notes: `| Year | Event |
|---|---|
| 1789 | French Revolution begins |
| 1914–1918 | World War I |
| 1939–1945 | World War II |
| 1969 | First Moon landing |
| 1989 | Fall of the Berlin Wall |
| 1991 | Uzbekistan declares independence |

For each event, learn the **causes**, the **key people** and the **consequences**.`,
  },
  // ── Computer Science ──
  {
    subject: "Computer Science",
    topic: "Binary & data",
    title: "Binary and data",
    summary: "Number bases, bits and bytes.",
    notes: `## Binary place values
| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|

\`101101\` = 32 + 8 + 4 + 1 = **45**.

- 1 byte = 8 bits; 8 bits can store $2^8 = 256$ different values.
- Hexadecimal uses 0–9 and A–F: \`2F\` = 2 × 16 + 15 = 47.`,
  },
  {
    subject: "Computer Science",
    topic: "Programming basics",
    title: "Programming basics",
    summary: "Variables, loops and tracing Python code.",
    notes: `\`\`\`python
total = 0
for i in range(1, 5):   # i = 1, 2, 3, 4
    total += i
print(total)            # 10
\`\`\`

- \`range(a, b)\` stops **before** \`b\`.
- Trace code with a table: one column per variable, one row per step.
- Data types: integer, float, string, Boolean (True/False).`,
  },
  {
    subject: "Computer Science",
    topic: "Algorithms",
    title: "Searching and sorting",
    summary: "Linear search, binary search and efficiency.",
    notes: `- **Linear search** checks each item in turn — up to $n$ checks.
- **Binary search** halves a **sorted** list each step — about $\\log_2 n$ checks.
- Sorting algorithms: bubble sort (simple, slow), merge sort (divide and conquer, fast).`,
  },
];

export const VOCAB_DECKS: { title: string; subject: string | null; description: string; level: string; words: [string, string, string, string, string][] }[] = [
  {
    title: "Academic English — Core",
    subject: "English",
    description: "High-frequency academic words for reading and writing.",
    level: "Intermediate",
    words: [
      ["abundant", "adj.", "existing in large quantities; plentiful", "Rainfall was abundant that spring, and the rivers ran high.", "plentiful, ample"],
      ["advocate", "v.", "to publicly support or recommend", "The doctor advocates daily exercise for all her patients.", "champion, promote"],
      ["ambiguous", "adj.", "open to more than one interpretation", "The ending of the film is ambiguous, leaving viewers to decide.", "unclear, vague"],
      ["assert", "v.", "to state a fact or belief confidently", "The author asserts that cities must plant more trees.", "declare, claim"],
      ["bolster", "v.", "to support or strengthen", "New data bolstered the scientists' theory.", "reinforce, boost"],
      ["concise", "adj.", "giving much information clearly in few words", "Her concise summary fit on a single page.", "brief, succinct"],
      ["credible", "adj.", "able to be believed; convincing", "An eyewitness account is usually a credible source.", "believable, reliable"],
      ["daunting", "adj.", "seeming difficult to deal with", "Writing a novel can be a daunting task.", "intimidating, formidable"],
      ["diminish", "v.", "to make or become less", "The pain diminished after a few hours.", "decrease, lessen"],
      ["empirical", "adj.", "based on observation or experiment", "The theory lacks empirical evidence.", "observed, experimental"],
      ["feasible", "adj.", "possible to do easily or conveniently", "Building the bridge in one year is not feasible.", "practical, achievable"],
      ["hinder", "v.", "to create difficulties that slow progress", "Heavy snow hindered the rescue effort.", "impede, obstruct"],
      ["inevitable", "adj.", "certain to happen; unavoidable", "Change is inevitable in any growing city.", "unavoidable, certain"],
      ["meticulous", "adj.", "showing great attention to detail", "The restorer was meticulous with every brushstroke.", "careful, precise"],
      ["mitigate", "v.", "to make less severe", "Trees can mitigate the effects of urban heat.", "alleviate, reduce"],
      ["plausible", "adj.", "seeming reasonable or probable", "Her explanation was plausible but unproven.", "believable, likely"],
      ["prevalent", "adj.", "widespread in a particular area or time", "Smartphone use is prevalent among teenagers.", "common, widespread"],
      ["robust", "adj.", "strong and healthy; vigorous", "The economy showed robust growth this year.", "strong, sturdy"],
      ["scarce", "adj.", "insufficient for the demand", "Water becomes scarce during a drought.", "rare, limited"],
      ["skeptical", "adj.", "not easily convinced; having doubts", "Scientists were skeptical of the bold claim.", "doubtful, questioning"],
      ["undermine", "v.", "to weaken gradually", "Constant criticism can undermine confidence.", "weaken, erode"],
      ["viable", "adj.", "capable of working successfully", "Solar power is a viable energy source for the region.", "workable, feasible"],
    ],
  },
  {
    title: "Linking Words",
    subject: "English",
    description: "Words that show how ideas connect in speaking and writing.",
    level: "Beginner",
    words: [
      ["consequently", "adv.", "as a result", "It rained all night; consequently, the match was cancelled.", "therefore, thus"],
      ["furthermore", "adv.", "in addition; besides", "The plan is cheap; furthermore, it is fast.", "moreover, also"],
      ["nevertheless", "adv.", "in spite of that", "The task was hard; nevertheless, they finished it.", "nonetheless, still"],
      ["likewise", "adv.", "in the same way; similarly", "Bees pollinate flowers; likewise, some bats do.", "similarly, equally"],
      ["whereas", "conj.", "in contrast with the fact that", "Some prefer tea, whereas others prefer coffee.", "while, although"],
      ["ultimately", "adv.", "finally; in the end", "Ultimately, the team chose the simpler design.", "eventually, finally"],
      ["for instance", "phrase", "as an example", "Many fruits, for instance apples, are rich in fibre.", "for example"],
      ["on the other hand", "phrase", "used to introduce a contrasting point", "The flat is small; on the other hand, it is cheap.", "however, conversely"],
    ],
  },
  {
    title: "Biology Key Terms",
    subject: "Biology",
    description: "Essential vocabulary for cells, genetics and the human body.",
    level: "Beginner",
    words: [
      ["osmosis", "term", "diffusion of water across a partially permeable membrane", "Plant roots take in water by osmosis.", ""],
      ["enzyme", "term", "a biological catalyst that speeds up reactions", "Amylase is an enzyme that breaks down starch.", "catalyst"],
      ["allele", "term", "a different version of the same gene", "Eye colour depends on which alleles you inherit.", ""],
      ["photosynthesis", "term", "making glucose from carbon dioxide and water using light", "Photosynthesis happens in chloroplasts.", ""],
      ["homeostasis", "term", "keeping internal conditions constant", "Sweating helps with homeostasis of body temperature.", "regulation"],
      ["mitosis", "term", "cell division that makes two identical cells", "Mitosis allows the body to grow and repair.", ""],
      ["ecosystem", "term", "all the organisms in an area and their environment", "A pond is a small ecosystem.", "habitat"],
      ["chromosome", "term", "a long DNA molecule carrying many genes", "Humans have 23 pairs of chromosomes.", ""],
    ],
  },
  {
    title: "Physics Key Terms",
    subject: "Physics",
    description: "Core vocabulary for motion, forces, energy and electricity.",
    level: "Beginner",
    words: [
      ["velocity", "term", "speed in a given direction", "The car's velocity was 20 m/s north.", ""],
      ["acceleration", "term", "the rate of change of velocity", "A falling ball has an acceleration of about 10 m/s².", ""],
      ["resultant force", "term", "the single force that has the same effect as all the forces acting", "If the resultant force is zero, the object's velocity doesn't change.", "net force"],
      ["current", "term", "the rate of flow of electric charge, measured in amperes", "The current through the lamp is 0.5 A.", ""],
      ["resistance", "term", "opposition to the flow of current, measured in ohms", "A longer wire has a higher resistance.", ""],
      ["frequency", "term", "the number of waves passing a point each second, in hertz", "The note has a frequency of 440 Hz.", ""],
    ],
  },
];

export const LIBRARY: { title: string; author: string; category: string; url: string; description: string; subject: string | null }[] = [
  { title: "Khan Academy", author: "Khan Academy", category: "VIDEO", url: "https://www.khanacademy.org/", description: "Free video lessons and practice for maths, science, computing and more.", subject: null },
  { title: "OpenStax free textbooks", author: "Rice University", category: "BOOK", url: "https://openstax.org/", description: "Peer-reviewed, openly licensed textbooks for maths, physics, chemistry and biology.", subject: null },
  { title: "PhET interactive simulations", author: "University of Colorado Boulder", category: "PRACTICE", url: "https://phet.colorado.edu/", description: "Free interactive simulations for physics, chemistry, biology and maths.", subject: "Physics" },
  { title: "GeoGebra", author: "GeoGebra", category: "PRACTICE", url: "https://www.geogebra.org/", description: "Dynamic geometry, graphing and calculators for exploring maths.", subject: "Mathematics" },
  { title: "Desmos graphing calculator", author: "Desmos", category: "PRACTICE", url: "https://www.desmos.com/calculator", description: "Graph functions, plot data and explore equations visually.", subject: "Mathematics" },
  { title: "BBC Bitesize", author: "BBC", category: "GUIDE", url: "https://www.bbc.co.uk/bitesize", description: "Short revision guides and quizzes for school subjects.", subject: null },
  { title: "LearnEnglish", author: "British Council", category: "GUIDE", url: "https://learnenglish.britishcouncil.org/", description: "Grammar, vocabulary, listening and reading practice at every level.", subject: "English" },
  { title: "CK-12", author: "CK-12 Foundation", category: "BOOK", url: "https://www.ck12.org/", description: "Free adaptive textbooks and practice for science and maths.", subject: null },
  { title: "MIT OpenCourseWare", author: "MIT", category: "VIDEO", url: "https://ocw.mit.edu/", description: "University course materials for advanced students.", subject: null },
];

export const PLATFORM_NEWS = [
  {
    title: "Welcome to BIS Learn",
    tag: "Announcement",
    pinned: true,
    body: "BIS Learn brings your learning center's subjects into one place: a question bank with step-by-step explanations, timed mock tests with instant results, a roadmap of lessons for each subject, vocabulary flashcards, a library, top universities and an AI tutor.\n\nStart with the **Roadmap** — it shows you what to study next in each of your subjects.",
  },
  {
    title: "New: AI Assistant",
    tag: "Update",
    pinned: false,
    body: "Stuck on a problem at midnight? The AI Assistant explains concepts step by step in any subject, checks your reasoning and suggests what to practise next. You'll also find an **Ask AI** button under every explanation in the question bank.",
  },
  {
    title: "Tip: learn from your mistakes",
    tag: "Tip",
    pinned: false,
    body: "After every test, open the results and filter by **Incorrect**. For each mistake, write one sentence about *why* you missed it — a careless slip, a gap in knowledge, or running out of time. Fixing the pattern is the fastest way to improve.",
  },
];
