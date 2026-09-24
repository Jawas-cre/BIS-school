// Original questions for Physics, Chemistry, Biology, History, Computer Science and
// Mental Arithmetic. Numeric generators compute each key from the numbers they print.
import { int, mcq, mulberry32, pick, type GenQuestion, type Rng } from "./math";

type Draft = Omit<GenQuestion, "subject">;
type Gen = (rng: Rng) => Draft;

const fmt = (n: number) => Number(n.toFixed(4)).toString();

function mc(rng: Rng, topic: string, difficulty: GenQuestion["difficulty"], stem: string, correct: string, wrong: string[], explanation: string, passage?: string): Draft {
  const { choices, answer } = mcq(rng, correct, wrong, () => "None of these");
  return { topic, difficulty, type: "MCQ", stem, choices, answer, explanation, passage };
}

function run(subject: string, gens: Gen[], per: number, seed: number, facts: ((rng: Rng) => Draft)[] = []): GenQuestion[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  const out: GenQuestion[] = [];
  for (const g of gens) {
    let made = 0;
    let tries = 0;
    while (made < per && tries++ < per * 8) {
      const q = g(rng);
      if (seen.has(q.stem)) continue;
      seen.add(q.stem);
      out.push({ subject, ...q });
      made++;
    }
  }
  for (const f of facts) out.push({ subject, ...f(rng) });
  return out;
}

// ─── Physics (g = 10 N/kg) ──────────────────────────────────────────────────

const physicsGens: Gen[] = [
  (rng) => {
    const v = pick(rng, [12, 15, 18, 20, 24, 30, 45]);
    const t = pick(rng, [1.5, 2, 2.5, 3, 4]);
    return { topic: "Motion", difficulty: "EASY", type: "SHORT", stem: `A cyclist travels ${fmt(v * t)} km in ${t} hours. What is the cyclist's average speed in km/h?`, answer: fmt(v), explanation: `Average speed $= \\dfrac{\\text{distance}}{\\text{time}} = \\dfrac{${fmt(v * t)}}{${t}} = ${v}$ km/h.` };
  },
  (rng) => {
    const u = pick(rng, [0, 2, 4, 5, 10]);
    const a = pick(rng, [1, 2, 3, 4, 5]);
    const t = pick(rng, [2, 3, 4, 5, 6]);
    return { topic: "Motion", difficulty: "MEDIUM", type: "SHORT", stem: `A car speeds up from ${u} m/s to ${u + a * t} m/s in ${t} s. What is its acceleration in m/s²?`, answer: fmt(a), explanation: `$a = \\dfrac{v - u}{t} = \\dfrac{${u + a * t} - ${u}}{${t}} = ${a}$ m/s².` };
  },
  (rng) => {
    const a = pick(rng, [2, 4, 6, 8, 10]);
    const t = pick(rng, [2, 3, 4, 5]);
    return { topic: "Motion", difficulty: "HARD", type: "SHORT", stem: `An object starts from rest and accelerates uniformly at ${a} m/s² for ${t} s. How far does it travel, in metres?`, answer: fmt(0.5 * a * t * t), explanation: `From rest, $s = \\tfrac{1}{2}at^2 = \\tfrac{1}{2}(${a})(${t})^2 = ${fmt(0.5 * a * t * t)}$ m.` };
  },
  (rng) => {
    const m = pick(rng, [2, 5, 8, 10, 12, 20, 50]);
    const a = pick(rng, [2, 3, 4, 5, 1.5]);
    return { topic: "Forces", difficulty: "EASY", type: "SHORT", stem: `What resultant force, in newtons, is needed to give a ${m} kg trolley an acceleration of ${a} m/s²?`, answer: fmt(m * a), explanation: `Newton's second law: $F = ma = ${m} \\times ${a} = ${fmt(m * a)}$ N.` };
  },
  (rng) => {
    const m = pick(rng, [3, 6, 45, 60, 72, 0.5]);
    const w = m * 10;
    return mc(rng, "Forces", "EASY", `What is the weight of a ${m} kg object on Earth? (g = 10 N/kg)`, `${fmt(w)} N`, [`${fmt(m)} N`, `${fmt(m / 10)} N`, `${fmt(w * 10)} N`], `Weight $W = mg = ${m} \\times 10 = ${fmt(w)}$ N. Mass (kg) and weight (N) are different quantities.`);
  },
  (rng) => {
    const f = pick(rng, [200, 400, 600, 800, 1200]);
    const area = pick(rng, [0.02, 0.04, 0.05, 0.1, 0.2]);
    return { topic: "Forces", difficulty: "MEDIUM", type: "SHORT", stem: `A box exerts a force of ${f} N on a floor over an area of ${area} m². What pressure does it exert, in pascals?`, answer: fmt(f / area), explanation: `$p = \\dfrac{F}{A} = \\dfrac{${f}}{${area}} = ${fmt(f / area)}$ Pa.` };
  },
  (rng) => {
    const m = pick(rng, [2, 4, 10, 50, 60]);
    const v = pick(rng, [2, 3, 4, 5, 6, 10]);
    return { topic: "Energy & power", difficulty: "MEDIUM", type: "SHORT", stem: `What is the kinetic energy, in joules, of a ${m} kg object moving at ${v} m/s?`, answer: fmt(0.5 * m * v * v), explanation: `$E_k = \\tfrac{1}{2}mv^2 = \\tfrac{1}{2}(${m})(${v})^2 = ${fmt(0.5 * m * v * v)}$ J.` };
  },
  (rng) => {
    const m = pick(rng, [0.5, 2, 5, 10, 40]);
    const h = pick(rng, [2, 3, 5, 8, 12, 20]);
    return { topic: "Energy & power", difficulty: "EASY", type: "SHORT", stem: `A ${m} kg box is lifted ${h} m onto a shelf. How much gravitational potential energy does it gain, in joules? (g = 10 N/kg)`, answer: fmt(m * 10 * h), explanation: `$E_p = mgh = ${m} \\times 10 \\times ${h} = ${fmt(m * 10 * h)}$ J.` };
  },
  (rng) => {
    const p = pick(rng, [50, 100, 150, 200, 500]);
    const t = pick(rng, [4, 5, 10, 20, 30]);
    return { topic: "Energy & power", difficulty: "EASY", type: "SHORT", stem: `A motor transfers ${p * t} J of energy in ${t} s. What is its power, in watts?`, answer: fmt(p), explanation: `$P = \\dfrac{E}{t} = \\dfrac{${p * t}}{${t}} = ${p}$ W.` };
  },
  (rng) => {
    const i = pick(rng, [0.5, 1, 2, 3, 4]);
    const r = pick(rng, [4, 6, 10, 12, 20]);
    return { topic: "Electricity", difficulty: "EASY", type: "SHORT", stem: `A ${r} Ω resistor has a potential difference of ${fmt(i * r)} V across it. What current flows through it, in amperes?`, answer: fmt(i), explanation: `Ohm's law: $I = \\dfrac{V}{R} = \\dfrac{${fmt(i * r)}}{${r}} = ${fmt(i)}$ A.` };
  },
  (rng) => {
    const rs = [int(rng, 2, 12), int(rng, 2, 12), int(rng, 2, 12)];
    return { topic: "Electricity", difficulty: "EASY", type: "SHORT", stem: `Resistors of ${rs[0]} Ω, ${rs[1]} Ω and ${rs[2]} Ω are connected in series. What is the total resistance, in ohms?`, answer: `${rs[0] + rs[1] + rs[2]}`, explanation: `In series, resistances add: ${rs.join(" + ")} = ${rs[0] + rs[1] + rs[2]} Ω.` };
  },
  (rng) => {
    const [a, b] = pick(rng, [[6, 3], [12, 4], [20, 5], [10, 10], [12, 6], [30, 15]] as const);
    const r = (a * b) / (a + b);
    return { topic: "Electricity", difficulty: "HARD", type: "SHORT", stem: `A ${a} Ω resistor and a ${b} Ω resistor are connected in parallel. What is their combined resistance, in ohms?`, answer: fmt(r), explanation: `For two resistors in parallel, $R = \\dfrac{R_1R_2}{R_1 + R_2} = \\dfrac{${a} \\times ${b}}{${a} + ${b}} = ${fmt(r)}$ Ω. The combined value is always smaller than the smallest resistor.` };
  },
  (rng) => {
    const v = pick(rng, [6, 12, 230]);
    const i = pick(rng, [0.5, 2, 3, 5]);
    return { topic: "Electricity", difficulty: "EASY", type: "SHORT", stem: `A heater connected to a ${v} V supply draws a current of ${i} A. What is its power, in watts?`, answer: fmt(v * i), explanation: `$P = VI = ${v} \\times ${i} = ${fmt(v * i)}$ W.` };
  },
  (rng) => {
    const f = pick(rng, [2, 5, 10, 50, 100, 440]);
    const l = pick(rng, [0.5, 0.75, 2, 3, 4]);
    return { topic: "Waves", difficulty: "EASY", type: "SHORT", stem: `A wave has a frequency of ${f} Hz and a wavelength of ${l} m. What is its speed, in m/s?`, answer: fmt(f * l), explanation: `$v = f\\lambda = ${f} \\times ${l} = ${fmt(f * l)}$ m/s.` };
  },
  (rng) => {
    const f = pick(rng, [2, 4, 5, 10, 20, 25, 50]);
    return { topic: "Waves", difficulty: "MEDIUM", type: "SHORT", stem: `A wave has a frequency of ${f} Hz. What is its period, in seconds?`, answer: fmt(1 / f), explanation: `$T = \\dfrac{1}{f} = \\dfrac{1}{${f}} = ${fmt(1 / f)}$ s.` };
  },
  (rng) => {
    const rho = pick(rng, [800, 1000, 2700, 7800]);
    const vol = pick(rng, [0.002, 0.005, 0.01, 0.5]);
    return { topic: "Matter", difficulty: "MEDIUM", type: "SHORT", stem: `A block has a mass of ${fmt(rho * vol)} kg and a volume of ${vol} m³. What is its density, in kg/m³?`, answer: fmt(rho), explanation: `$\\rho = \\dfrac{m}{V} = \\dfrac{${fmt(rho * vol)}}{${vol}} = ${rho}$ kg/m³.` };
  },
];

const physicsFacts = [
  (rng: Rng) => mc(rng, "Forces", "EASY", "What is the SI unit of force?", "newton (N)", ["joule (J)", "watt (W)", "pascal (Pa)"], "Force is measured in newtons. Joules measure energy, watts power, and pascals pressure."),
  (rng: Rng) => mc(rng, "Motion", "MEDIUM", "Which of these is a vector quantity?", "Velocity", ["Speed", "Mass", "Time"], "A vector has both size and direction. Velocity is speed in a given direction; speed, mass and time have size only (scalars)."),
  (rng: Rng) => mc(rng, "Forces", "MEDIUM", "According to Newton's third law, when you push on a wall with a force of 50 N, the wall pushes on you with a force of…", "50 N in the opposite direction", ["0 N, because the wall doesn't move", "50 N in the same direction", "less than 50 N"], "Newton's third law: forces come in equal and opposite pairs acting on different objects."),
  (rng: Rng) => mc(rng, "Waves", "EASY", "Through which of these can sound NOT travel?", "A vacuum", ["Water", "Steel", "Air"], "Sound is a mechanical wave that needs particles to vibrate, so it cannot travel through a vacuum."),
  (rng: Rng) => mc(rng, "Energy & power", "EASY", "What is the main useful energy transfer in a solar panel?", "Light energy to electrical energy", ["Chemical energy to electrical energy", "Electrical energy to light energy", "Heat energy to kinetic energy"], "Solar (photovoltaic) cells transfer energy from light into electrical energy."),
];

// ─── Chemistry ──────────────────────────────────────────────────────────────

const ELEMENTS = [
  ["carbon", 6, 12], ["nitrogen", 7, 14], ["oxygen", 8, 16], ["sodium", 11, 23], ["magnesium", 12, 24],
  ["aluminium", 13, 27], ["chlorine", 17, 35], ["potassium", 19, 39], ["calcium", 20, 40], ["iron", 26, 56],
] as const;

const COMPOUNDS = [
  ["water", "H_2O", 18], ["carbon dioxide", "CO_2", 44], ["sodium chloride", "NaCl", 58.5], ["calcium carbonate", "CaCO_3", 100],
  ["sulfuric acid", "H_2SO_4", 98], ["ammonia", "NH_3", 17], ["methane", "CH_4", 16], ["magnesium oxide", "MgO", 40],
  ["sodium hydroxide", "NaOH", 40], ["glucose", "C_6H_{12}O_6", 180], ["hydrochloric acid (HCl)", "HCl", 36.5],
] as const;

const AR = "Relative atomic masses: H = 1, C = 12, N = 14, O = 16, Na = 23, Mg = 24, S = 32, Cl = 35.5, Ca = 40.";

const chemistryGens: Gen[] = [
  (rng) => {
    const [name, z, a] = pick(rng, ELEMENTS);
    const ask = pick(rng, ["neutrons", "protons", "electrons"] as const);
    const value = ask === "neutrons" ? a - z : z;
    return { topic: "Atomic structure", difficulty: ask === "neutrons" ? "MEDIUM" : "EASY", type: "SHORT", stem: `An atom of ${name} has atomic number ${z} and mass number ${a}. How many ${ask} does it have?`, answer: `${value}`, explanation: ask === "neutrons" ? `Neutrons = mass number − atomic number = ${a} − ${z} = ${value}.` : `The atomic number is the number of protons; a neutral atom has the same number of electrons: ${z}.` };
  },
  (rng) => {
    const [name, formula, mr] = pick(rng, COMPOUNDS);
    return { topic: "Chemical formulas & moles", difficulty: "MEDIUM", type: "SHORT", stem: `What is the relative formula mass (molar mass, g/mol) of ${name}, $\\mathrm{${formula}}$?\n\n${AR}`, answer: fmt(mr), explanation: `Add the relative atomic masses of every atom in $\\mathrm{${formula}}$: the total is ${fmt(mr)} g/mol.` };
  },
  (rng) => {
    const [name, formula, mr] = pick(rng, COMPOUNDS.filter((c) => Number.isInteger(c[2])));
    const n = pick(rng, [0.5, 2, 3, 4, 0.25]);
    return { topic: "Chemical formulas & moles", difficulty: "MEDIUM", type: "SHORT", stem: `How many moles are there in ${fmt(n * mr)} g of ${name} ($\\mathrm{${formula}}$, molar mass ${mr} g/mol)?`, answer: fmt(n), explanation: `$n = \\dfrac{m}{M} = \\dfrac{${fmt(n * mr)}}{${mr}} = ${fmt(n)}$ mol.` };
  },
  (rng) => {
    const [name, formula, mr] = pick(rng, COMPOUNDS);
    const n = pick(rng, [2, 3, 0.5, 0.1, 5]);
    return { topic: "Chemical formulas & moles", difficulty: "EASY", type: "SHORT", stem: `What is the mass, in grams, of ${n} mol of ${name} ($\\mathrm{${formula}}$, molar mass ${mr} g/mol)?`, answer: fmt(n * mr), explanation: `$m = nM = ${n} \\times ${mr} = ${fmt(n * mr)}$ g.` };
  },
  (rng) => {
    const n = pick(rng, [0.1, 0.25, 0.5, 1, 2]);
    const v = pick(rng, [0.1, 0.25, 0.5, 2]);
    return { topic: "Solutions", difficulty: "MEDIUM", type: "SHORT", stem: `${n} mol of a salt is dissolved in water to make ${fmt(v * 1000)} mL of solution. What is the concentration in mol/L?`, answer: fmt(n / v), explanation: `Convert the volume to litres (${v} L), then $c = \\dfrac{n}{V} = \\dfrac{${n}}{${v}} = ${fmt(n / v)}$ mol/L.` };
  },
  (rng) => {
    const cases = [["carbon", "CO_2", 12, 44], ["oxygen", "H_2O", 16, 18], ["calcium", "CaCO_3", 40, 100], ["nitrogen", "NH_3", 14, 17], ["magnesium", "MgO", 24, 40]] as const;
    const [el, formula, part, whole] = pick(rng, cases);
    const p = (part / whole) * 100;
    return { topic: "Chemical formulas & moles", difficulty: "HARD", type: "SHORT", stem: `What is the percentage by mass of ${el} in $\\mathrm{${formula}}$, to the nearest whole number?\n\n${AR}`, answer: `${Math.round(p)}|${p.toFixed(1)}`, explanation: `% by mass $= \\dfrac{${part}}{${whole}} \\times 100 = ${p.toFixed(1)}\\% \\approx ${Math.round(p)}\\%$.` };
  },
];

const chemistryFacts = [
  (rng: Rng) => mc(rng, "Periodic table", "EASY", "What are the elements in Group 1 of the periodic table called?", "Alkali metals", ["Halogens", "Noble gases", "Transition metals"], "Group 1 (lithium, sodium, potassium…) are the alkali metals; Group 7 are halogens and Group 0/18 the noble gases."),
  (rng: Rng) => mc(rng, "Solutions", "EASY", "What is the pH of a neutral solution at 25 °C?", "7", ["0", "1", "14"], "pH 7 is neutral; below 7 is acidic and above 7 is alkaline."),
  (rng: Rng) => mc(rng, "Periodic table", "EASY", "Which of these elements is a noble gas?", "Argon", ["Nitrogen", "Oxygen", "Chlorine"], "Argon is in Group 0/18 with helium, neon, krypton and xenon. It has a full outer shell, so it is very unreactive."),
  (rng: Rng) => mc(rng, "Periodic table", "MEDIUM", "Going from left to right across a period, the atomic radius of the elements generally…", "decreases", ["increases", "stays the same", "doubles"], "Across a period, protons are added to the nucleus while electrons go into the same shell, so the outer electrons are pulled closer and the radius decreases."),
  (rng: Rng) => mc(rng, "Reactions", "MEDIUM", "What type of reaction is $\\mathrm{CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O}$?", "Combustion", ["Neutralisation", "Thermal decomposition", "Displacement"], "A fuel (methane) reacting with oxygen to release energy, producing carbon dioxide and water, is combustion."),
  (rng: Rng) => mc(rng, "Reactions", "EASY", "In the balanced equation $\\mathrm{2H_2 + O_2 \\rightarrow 2H_2O}$, how many molecules of hydrogen react with one molecule of oxygen?", "2", ["1", "3", "4"], "The coefficient in front of $\\mathrm{H_2}$ is 2, so two molecules of hydrogen react with one molecule of oxygen."),
  (rng: Rng) => mc(rng, "Atomic structure", "MEDIUM", "An ionic bond usually forms between…", "a metal and a non-metal", ["two non-metals", "two noble gases", "two metals"], "Metals lose electrons to form positive ions and non-metals gain them to form negative ions; the attraction between them is an ionic bond."),
];

// ─── Biology ────────────────────────────────────────────────────────────────

const biologyGens: Gen[] = [
  (rng) => {
    const crosses = [["Aa", "Aa", 25], ["Aa", "aa", 50], ["AA", "aa", 0], ["aa", "aa", 100], ["AA", "Aa", 0]] as const;
    const [p1, p2, recessive] = pick(rng, crosses);
    return { topic: "Genetics", difficulty: "HARD", type: "SHORT", stem: `In pea plants, tall (A) is dominant to short (a). Two plants with genotypes ${p1} and ${p2} are crossed. What percentage of the offspring are expected to be short?`, answer: `${recessive}`, explanation: `Draw a Punnett square for ${p1} × ${p2}. Only offspring with genotype aa are short, which is ${recessive}% of the combinations.` };
  },
  (rng) => {
    const e = pick(rng, [10000, 20000, 50000, 80000]);
    return { topic: "Ecology", difficulty: "MEDIUM", type: "SHORT", stem: `In a food chain, the producers store ${e.toLocaleString("en-US")} kJ of energy. Using the rule that about 10% of energy passes to each next level, how much energy (in kJ) reaches the secondary consumers?`, answer: `${e / 100}`, explanation: `Producers → primary consumers: 10% of ${e} = ${e / 10} kJ. Primary → secondary consumers: 10% of ${e / 10} = ${e / 100} kJ.` };
  },
];

const biologyFacts = [
  (rng: Rng) => mc(rng, "Cells", "EASY", "In which organelle does most aerobic respiration take place?", "Mitochondria", ["Ribosomes", "Nucleus", "Cell membrane"], "Mitochondria release energy from glucose through aerobic respiration."),
  (rng: Rng) => mc(rng, "Cells", "EASY", "Which structure is found in plant cells but not in animal cells?", "Cell wall", ["Cell membrane", "Nucleus", "Mitochondria"], "Plant cells have a cellulose cell wall (and usually chloroplasts and a large vacuole); animal cells do not."),
  (rng: Rng) => mc(rng, "Cells", "MEDIUM", "Where in the cell are proteins made?", "Ribosomes", ["Nucleus", "Vacuole", "Cell wall"], "Ribosomes read the genetic code and join amino acids together to make proteins."),
  (rng: Rng) => mc(rng, "Cells", "MEDIUM", "What is the movement of water from a dilute solution to a more concentrated solution through a partially permeable membrane called?", "Osmosis", ["Diffusion", "Active transport", "Respiration"], "Osmosis is the diffusion of water across a partially permeable membrane, from a dilute to a more concentrated solution."),
  (rng: Rng) => mc(rng, "Genetics", "EASY", "In DNA, adenine (A) always pairs with…", "thymine (T)", ["guanine (G)", "cytosine (C)", "uracil (U)"], "Complementary base pairing: A pairs with T, and C pairs with G."),
  (rng: Rng) => mc(rng, "Genetics", "MEDIUM", "Human body cells contain 46 chromosomes. How many chromosomes are in a human egg or sperm cell?", "23", ["46", "92", "12"], "Gametes are made by meiosis and contain half the number of chromosomes (23), so fertilisation restores 46."),
  (rng: Rng) => mc(rng, "Human body", "EASY", "Which blood vessels carry blood away from the heart?", "Arteries", ["Veins", "Capillaries", "Valves"], "Arteries carry blood away from the heart under high pressure; veins return it to the heart."),
  (rng: Rng) => mc(rng, "Human body", "MEDIUM", "Which enzyme in saliva starts the digestion of starch?", "Amylase", ["Lipase", "Protease", "Bile"], "Amylase breaks starch down into sugars. Lipase digests fats and proteases digest proteins; bile is not an enzyme."),
  (rng: Rng) => mc(rng, "Human body", "EASY", "Which organ produces the hormone insulin?", "Pancreas", ["Liver", "Kidney", "Stomach"], "The pancreas releases insulin, which lowers blood glucose concentration."),
  (rng: Rng) => mc(rng, "Human body", "EASY", "Where does gas exchange take place in the lungs?", "Alveoli", ["Trachea", "Bronchi", "Diaphragm"], "Alveoli are tiny air sacs with a large surface area and thin walls, surrounded by capillaries."),
  (rng: Rng) => mc(rng, "Ecology", "EASY", "What do we call organisms that make their own food, such as green plants?", "Producers", ["Consumers", "Decomposers", "Predators"], "Producers make glucose by photosynthesis and start almost every food chain."),
  (rng: Rng) => mc(rng, "Ecology", "MEDIUM", "In the food chain grass → grasshopper → frog → snake, the frog is a…", "secondary consumer", ["producer", "primary consumer", "tertiary consumer"], "Grass is the producer, the grasshopper eats it (primary consumer) and the frog eats the grasshopper (secondary consumer)."),
  (rng: Rng) => mc(rng, "Plants", "EASY", "What are the products of photosynthesis?", "Glucose and oxygen", ["Carbon dioxide and water", "Glucose and carbon dioxide", "Oxygen and water"], "carbon dioxide + water → (light, chlorophyll) → glucose + oxygen."),
  (rng: Rng) => mc(rng, "Plants", "EASY", "Which pigment in leaves absorbs light for photosynthesis?", "Chlorophyll", ["Haemoglobin", "Melanin", "Keratin"], "Chlorophyll, found in chloroplasts, absorbs light energy."),
  (rng: Rng) => mc(rng, "Plants", "MEDIUM", "Which tissue transports water from the roots to the leaves?", "Xylem", ["Phloem", "Stomata", "Epidermis"], "Xylem carries water and mineral ions upward; phloem transports sugars around the plant."),
];

// ─── History ────────────────────────────────────────────────────────────────

const historyFacts = [
  (rng: Rng) => mc(rng, "Ancient world", "EASY", "Which ancient civilization built the pyramids of Giza?", "Ancient Egypt", ["Ancient Greece", "The Roman Empire", "The Maya"], "The Great Pyramid of Giza was built for the pharaoh Khufu around 2560 BCE."),
  (rng: Rng) => mc(rng, "Ancient world", "MEDIUM", "Which ancient people developed cuneiform, one of the earliest writing systems?", "The Sumerians of Mesopotamia", ["The ancient Egyptians", "The ancient Chinese", "The Romans"], "Cuneiform — wedge-shaped marks pressed into clay — was developed in Sumer (southern Mesopotamia) around 3200 BCE."),
  (rng: Rng) => mc(rng, "Ancient world", "EASY", "Alexander the Great was the king of…", "Macedon", ["Persia", "Egypt", "Rome"], "Alexander became king of Macedon in 336 BCE and built an empire stretching to Central Asia and India."),
  (rng: Rng) => mc(rng, "Middle Ages", "EASY", "What was the Silk Road?", "A network of trade routes linking China with the Mediterranean", ["A road built by the Romans in Britain", "A canal connecting two seas", "A pilgrimage route in Spain"], "The Silk Road carried silk, spices, ideas and religions across Eurasia, passing through cities such as Samarkand and Bukhara."),
  (rng: Rng) => mc(rng, "Middle Ages", "MEDIUM", "In which year was the Magna Carta sealed in England?", "1215", ["1066", "1492", "1648"], "King John agreed to the Magna Carta in 1215; it limited royal power and influenced later ideas about law and rights."),
  (rng: Rng) => mc(rng, "Middle Ages", "EASY", "Who is credited with introducing printing with movable metal type in Europe around 1440?", "Johannes Gutenberg", ["Leonardo da Vinci", "Galileo Galilei", "Martin Luther"], "Gutenberg's press made books far cheaper and faster to produce, helping ideas spread across Europe."),
  (rng: Rng) => mc(rng, "Modern history", "EASY", "In which year did the French Revolution begin?", "1789", ["1776", "1812", "1848"], "The storming of the Bastille on 14 July 1789 is seen as the start of the French Revolution."),
  (rng: Rng) => mc(rng, "Modern history", "EASY", "In which year did World War II end?", "1945", ["1918", "1939", "1950"], "The war in Europe ended in May 1945 and in Asia in September 1945."),
  (rng: Rng) => mc(rng, "Modern history", "MEDIUM", "In which year did the Berlin Wall fall?", "1989", ["1961", "1975", "1991"], "The Berlin Wall, built in 1961, was opened on 9 November 1989; Germany reunified in 1990."),
  (rng: Rng) => mc(rng, "Modern history", "EASY", "Who was the first person to walk on the Moon, in 1969?", "Neil Armstrong", ["Yuri Gagarin", "Buzz Aldrin", "John Glenn"], "Neil Armstrong stepped onto the Moon on 20 July 1969 during Apollo 11; Yuri Gagarin was the first human in space (1961)."),
  (rng: Rng) => mc(rng, "History of Central Asia", "EASY", "Who founded the Timurid Empire in 1370?", "Amir Temur", ["Chinggis Khan", "Babur", "Ulugh Beg"], "Amir Temur (Tamerlane) founded the Timurid Empire and made Samarkand its capital."),
  (rng: Rng) => mc(rng, "History of Central Asia", "EASY", "Which city was the capital of Amir Temur's empire?", "Samarkand", ["Bukhara", "Khiva", "Tashkent"], "Temur made Samarkand his capital and filled it with monumental buildings."),
  (rng: Rng) => mc(rng, "History of Central Asia", "MEDIUM", "Ulugh Beg, grandson of Amir Temur, is best known for…", "building an astronomical observatory in Samarkand", ["founding the Mughal Empire", "writing the Canon of Medicine", "building the Great Wall"], "Ulugh Beg's observatory (1420s) produced one of the most accurate star catalogues of its time."),
  (rng: Rng) => mc(rng, "History of Central Asia", "EASY", "In which year did Uzbekistan declare independence?", "1991", ["1917", "1945", "2001"], "Uzbekistan declared independence on 31 August 1991; Independence Day is celebrated on 1 September."),
  (rng: Rng) => mc(rng, "History of Central Asia", "MEDIUM", "The word “algorithm” comes from the name of which scholar from Khorezm?", "Muhammad al-Khwarizmi", ["Ibn Sina", "Al-Biruni", "Alisher Navoi"], "Al-Khwarizmi (9th century) wrote foundational works on algebra and arithmetic; Latin versions of his name gave us “algorithm”."),
  (rng: Rng) => mc(rng, "History of Central Asia", "MEDIUM", "Ibn Sina (Avicenna), born near Bukhara, is famous for writing…", "The Canon of Medicine", ["The Book of Kings", "Baburnama", "The Travels of Marco Polo"], "The Canon of Medicine was used as a medical textbook in Europe and the Islamic world for centuries."),
  (rng: Rng) => mc(rng, "History of Central Asia", "MEDIUM", "Babur, born in Andijan, founded which empire in 1526?", "The Mughal Empire in India", ["The Timurid Empire", "The Ottoman Empire", "The Safavid Empire"], "After the Battle of Panipat in 1526, Babur founded the Mughal Empire; he described his life in the Baburnama."),
];

// ─── Computer Science ───────────────────────────────────────────────────────

const csGens: Gen[] = [
  (rng) => {
    const n = int(rng, 5, 200);
    const bin = n.toString(2);
    return { topic: "Binary & data", difficulty: "EASY", type: "SHORT", stem: `Convert the binary number \`${bin}\` to decimal.`, answer: `${n}`, explanation: `Add the place values of the 1s: ${[...bin].map((b, i) => (b === "1" ? 2 ** (bin.length - 1 - i) : null)).filter((x) => x !== null).join(" + ")} = ${n}.` };
  },
  (rng) => {
    const n = int(rng, 9, 120);
    const correct = n.toString(2);
    const near = [(n + 1).toString(2), (n - 1).toString(2), n.toString(2).split("").reverse().join("")];
    const q = mc(rng, "Binary & data", "MEDIUM", `What is the decimal number ${n} in binary?`, `\`${correct}\``, near.map((b) => `\`${b}\``), `Divide by 2 repeatedly and read the remainders from bottom to top: ${n} = \`${correct}\`₂.`);
    return q;
  },
  (rng) => {
    const n = pick(rng, [2, 4, 16, 64, 128]);
    return { topic: "Binary & data", difficulty: "EASY", type: "SHORT", stem: `How many bits are there in ${n} bytes?`, answer: `${n * 8}`, explanation: `1 byte = 8 bits, so ${n} bytes = ${n} × 8 = ${n * 8} bits.` };
  },
  (rng) => {
    const n = int(rng, 20, 255);
    const hex = n.toString(16).toUpperCase();
    return { topic: "Binary & data", difficulty: "HARD", type: "SHORT", stem: `What is the hexadecimal number \`${hex}\` in decimal?`, answer: `${n}`, explanation: `Each hex digit is a power of 16: ${hex.length === 2 ? `${parseInt(hex[0], 16)} × 16 + ${parseInt(hex[1], 16)} = ${n}` : `= ${n}`}.` };
  },
  (rng) => {
    const n = int(rng, 4, 12);
    return { topic: "Programming basics", difficulty: "MEDIUM", type: "SHORT", stem: `What does this Python program print?\n\n\`\`\`python\ntotal = 0\nfor i in range(1, ${n + 1}):\n    total += i\nprint(total)\n\`\`\``, answer: `${(n * (n + 1)) / 2}`, explanation: `\`range(1, ${n + 1})\` gives 1 to ${n}, so the loop adds 1 + 2 + … + ${n} = ${(n * (n + 1)) / 2}.` };
  },
  (rng) => {
    const a = int(rng, 2, 9);
    const b = int(rng, 1, 9);
    const c = int(rng, 2, 4);
    return { topic: "Programming basics", difficulty: "EASY", type: "SHORT", stem: `What does this Python program print?\n\n\`\`\`python\nx = ${a}\nx = x * ${c} + ${b}\nprint(x)\n\`\`\``, answer: `${a * c + b}`, explanation: `x starts at ${a}; then x = ${a} × ${c} + ${b} = ${a * c + b}.` };
  },
];

const csFacts = [
  (rng: Rng) => mc(rng, "Computer systems", "EASY", "What does CPU stand for?", "Central Processing Unit", ["Computer Personal Unit", "Central Program Utility", "Control Processing User"], "The CPU fetches, decodes and executes instructions."),
  (rng: Rng) => mc(rng, "Computer systems", "MEDIUM", "Which type of memory loses its contents when the power is switched off?", "RAM", ["ROM", "SSD storage", "A hard disk drive"], "RAM is volatile; ROM, SSDs and hard disks keep their data without power."),
  (rng: Rng) => mc(rng, "Algorithms", "MEDIUM", "What must be true about a list before you can use binary search on it?", "It must be sorted", ["It must contain only numbers", "It must have an even number of items", "It must contain no duplicates"], "Binary search repeatedly halves the search range by comparing with the middle item, which only works if the list is in order."),
  (rng: Rng) => mc(rng, "Algorithms", "MEDIUM", "In the worst case, how many items does a linear search check in a list of n items?", "n", ["log₂ n", "n²", "1"], "Linear search checks items one by one, so if the target is last or missing it checks all n items."),
  (rng: Rng) => mc(rng, "Programming basics", "EASY", "Which data type stores only the values True or False?", "Boolean", ["Integer", "String", "Float"], "A Boolean has exactly two values: True and False."),
  (): Draft => ({ topic: "Binary & data", difficulty: "MEDIUM", type: "SHORT", stem: "How many different values can be represented with 8 bits?", answer: "256", explanation: "Each bit doubles the number of combinations: $2^8 = 256$ (the values 0–255)." }),
];

// ─── Mental arithmetic (used as a center-only subject in the demo) ─────────

const arithmeticGens: Gen[] = [
  (rng) => {
    const a = int(rng, 120, 899);
    const b = int(rng, 45, 499);
    return { topic: "Addition & subtraction", difficulty: "EASY", type: "SHORT", stem: `Calculate mentally: ${a} + ${b}`, answer: `${a + b}`, explanation: `Split into hundreds, tens and ones: ${a} + ${b} = ${a + b}.` };
  },
  (rng) => {
    const a = int(rng, 300, 999);
    const b = int(rng, 45, 299);
    return { topic: "Addition & subtraction", difficulty: "MEDIUM", type: "SHORT", stem: `Calculate mentally: ${a} − ${b}`, answer: `${a - b}`, explanation: `${a} − ${b} = ${a - b}. Tip: subtract a round number, then adjust.` };
  },
  (rng) => {
    const a = int(rng, 12, 99);
    const b = int(rng, 3, 9);
    return { topic: "Multiplication", difficulty: "MEDIUM", type: "SHORT", stem: `Calculate mentally: ${a} × ${b}`, answer: `${a * b}`, explanation: `${a} × ${b} = ${Math.floor(a / 10) * 10} × ${b} + ${a % 10} × ${b} = ${a * b}.` };
  },
  (rng) => {
    const b = int(rng, 3, 12);
    const q = int(rng, 6, 40);
    return { topic: "Division", difficulty: "MEDIUM", type: "SHORT", stem: `Calculate mentally: ${b * q} ÷ ${b}`, answer: `${q}`, explanation: `${b} × ${q} = ${b * q}, so ${b * q} ÷ ${b} = ${q}.` };
  },
];

export function generatePhysics() {
  return run("Physics", physicsGens, 4, 101, physicsFacts);
}
export function generateChemistry() {
  return run("Chemistry", chemistryGens, 6, 202, chemistryFacts);
}
export function generateBiology() {
  return run("Biology", biologyGens, 4, 303, biologyFacts);
}
export function generateHistory() {
  return run("History", [], 0, 404, historyFacts);
}
export function generateComputerScience() {
  return run("Computer Science", csGens, 5, 505, csFacts);
}
export function generateArithmetic() {
  return run("Mental Arithmetic", arithmeticGens, 8, 606);
}
