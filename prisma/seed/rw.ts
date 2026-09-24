// Original English questions: reading comprehension, vocabulary, linking words, punctuation and grammar.
// Each item lists the correct choice first; choices are shuffled when seeded.
import { mcq, mulberry32, type GenQuestion } from "./math";

type Item = {
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  passage: string;
  stem: string;
  correct: string;
  wrong: [string, string, string];
  explanation: string;
};

const MAIN_IDEA = "Which choice best states the main idea of the text?";
const LOGICAL = "Which choice most logically completes the text?";
const WIC = "Which choice completes the text with the most logical and precise word or phrase?";
const TRANSITION = "Which choice completes the text with the most logical transition?";
const CONVENTIONS = "Which choice completes the text so that it conforms to the conventions of Standard English?";
const NOTES = "While researching a topic, a student has taken the following notes:";

const PASSAGE_ITEMS: Item[] = [
  // ── Central Ideas and Details ──
  {
    skill: "Central Ideas and Details",
    difficulty: "EASY",
    passage:
      "City surfaces such as asphalt and concrete absorb sunlight during the day and release it as heat at night, making many downtown areas several degrees warmer than nearby countryside. To test one possible remedy, engineers in a large city covered the roofs of twelve office buildings with low-growing plants and compared them with twelve similar buildings that had ordinary roofs. Over two summers, the planted roofs stayed markedly cooler, and the buildings beneath them used less electricity for air conditioning.",
    stem: MAIN_IDEA,
    correct: "A study found that covering roofs with plants helped reduce heat and energy use in city buildings.",
    wrong: [
      "Asphalt and concrete are the main reasons that cities use more electricity than rural areas do.",
      "Engineers have concluded that every building in a city should replace its roof with plants.",
      "Downtown areas are warmer than the countryside only during summer nights.",
    ],
    explanation:
      "The text introduces the problem of urban heat and then describes a study showing that planted roofs stayed cooler and lowered air-conditioning use. The other choices overstate the findings or focus on minor details.",
  },
  {
    skill: "Central Ideas and Details",
    difficulty: "MEDIUM",
    passage:
      "In the workshops of Margilan, weavers still produce abr, a silk fabric whose name comes from the Persian word for \"cloud.\" Before weaving, artisans tie tight bundles along the threads and dip them in successive dye baths, so that each section of thread absorbs color in a planned pattern. When the threads are finally woven, the colors meet with slightly blurred edges, giving the cloth its soft, cloudlike appearance. Because every step depends on precise hand measurements, a single bolt can take weeks to complete.",
    stem: "According to the text, what gives abr fabric its cloudlike appearance?",
    correct: "The pre-dyed sections of thread meet with slightly blurred edges when woven.",
    wrong: [
      "The silk is dyed only once, after the fabric has been woven.",
      "Weavers paint cloud shapes onto the finished cloth by hand.",
      "The fabric is woven loosely so that light passes through it.",
    ],
    explanation:
      "The passage explains that threads are dyed in sections before weaving and that \"the colors meet with slightly blurred edges, giving the cloth its soft, cloudlike appearance.\"",
  },
  {
    skill: "Central Ideas and Details",
    difficulty: "MEDIUM",
    passage:
      "Zarina had rehearsed the speech so many times that the words no longer seemed to belong to her. Standing behind the curtain, she could hear the murmur of the audience rising and falling like water against a shore. Then she noticed her younger brother in the front row, swinging his legs and grinning at the empty stage as if something wonderful were about to happen there. She folded her notes, put them in her pocket, and stepped into the light.",
    stem: MAIN_IDEA,
    correct: "Seeing her brother's excitement helps Zarina set aside her nervousness and face the audience.",
    wrong: [
      "Zarina decides not to give her speech because she has forgotten her notes.",
      "Zarina's brother is nervous about the speech he will give later that day.",
      "The audience grows restless because Zarina takes too long to begin.",
    ],
    explanation:
      "Zarina begins detached and anxious, but her brother's grin prompts her to put her notes away and step onto the stage — a shift from nervousness to confidence.",
  },
  {
    skill: "Central Ideas and Details",
    difficulty: "HARD",
    passage:
      "For decades, historians assumed that medieval merchants on the Silk Road traveled the entire route themselves, carrying goods from China to the Mediterranean. Recent studies of trade records and caravanserai ledgers suggest a different picture. Most merchants appear to have traveled only a few hundred kilometers before selling their goods to other traders, who carried them farther along. Silk and spices thus moved across Eurasia less like a single long journey than like a relay, passing through many hands and markets on the way.",
    stem: MAIN_IDEA,
    correct: "New evidence suggests Silk Road trade worked mainly through many short exchanges rather than single long journeys.",
    wrong: [
      "Historians have found that silk was rarely traded on the Silk Road.",
      "Caravanserai ledgers show that merchants preferred to trade spices rather than silk.",
      "Merchants on the Silk Road traveled farther than historians once believed.",
    ],
    explanation:
      "The text contrasts an older assumption (merchants traveled the whole route) with new evidence of a relay system of short trips — that contrast is the central idea.",
  },
  // ── Command of Evidence ──
  {
    skill: "Command of Evidence",
    difficulty: "MEDIUM",
    passage:
      "\"Hope\" is the thing with feathers is an 1891 poem by Emily Dickinson. In the poem, the speaker suggests that hope sustains people through the hardest times while asking nothing in return:\n\n> \"Hope\" is the thing with feathers - / That perches in the soul - / And sings the tune without the words - / And never stops - at all - / And sweetest - in the Gale - is heard - / And sore must be the storm - / That could abash the little Bird / That kept so many warm - / I've heard it in the chillest land - / And on the strangest Sea - / Yet - never - in Extremity, / It asked a crumb - of me.",
    stem: "Which quotation from the poem most effectively illustrates the claim that hope asks nothing in return?",
    correct: "\"Yet - never - in Extremity, / It asked a crumb - of me.\"",
    wrong: [
      "\"And sings the tune without the words - / And never stops - at all -\"",
      "\"I've heard it in the chillest land - / And on the strangest Sea -\"",
      "\"And sweetest - in the Gale - is heard -\"",
    ],
    explanation:
      "The claim is that hope demands nothing. Only the final lines say that, even in extreme hardship, hope never \"asked a crumb\" of the speaker.",
  },
  {
    skill: "Command of Evidence",
    difficulty: "HARD",
    passage:
      "Biologist Dilafruz Umarova studies desert gerbils, which rarely drink water. She hypothesizes that the gerbils obtain most of their water not from dew or plants but from the chemical breakdown of the dry seeds they eat, a process that releases water inside the body.",
    stem: "Which finding, if true, would most directly support Umarova's hypothesis?",
    correct: "Gerbils fed only dry seeds and given no water maintained normal body hydration for several weeks.",
    wrong: [
      "Gerbils that were given access to fresh plants ate more plants than seeds.",
      "Dew forms on desert plants on most mornings in the gerbils' habitat.",
      "Gerbils are most active at night, when temperatures in the desert are lower.",
    ],
    explanation:
      "If gerbils stay hydrated on a diet of only dry seeds with no other water sources, their water must come from the seeds themselves — exactly what the hypothesis predicts.",
  },
  {
    skill: "Command of Evidence",
    difficulty: "MEDIUM",
    passage:
      "A school surveyed students about their average nightly sleep and their average daily screen time after 9 p.m.\n\n| Screen time after 9 p.m. | Average sleep (hours) |\n|---|---|\n| Less than 30 minutes | 8.1 |\n| 30–60 minutes | 7.6 |\n| 1–2 hours | 7.0 |\n| More than 2 hours | 6.4 |\n\nThe school counselor argues that late-night screen use is associated with less sleep. As evidence, she notes that students reporting more than 2 hours of screen time after 9 p.m. ______",
    stem: "Which choice most effectively uses data from the table to complete the statement?",
    correct: "averaged 6.4 hours of sleep, compared with 8.1 hours for students reporting less than 30 minutes.",
    wrong: [
      "averaged 7.6 hours of sleep, the most of any group in the survey.",
      "slept about as much as students reporting 30–60 minutes of screen time.",
      "averaged 8.1 hours of sleep, compared with 6.4 hours for students reporting less than 30 minutes.",
    ],
    explanation:
      "The table shows sleep falling as screen time rises: 6.4 hours for the heaviest users versus 8.1 hours for the lightest. The other choices misread the table.",
  },
  {
    skill: "Command of Evidence",
    difficulty: "HARD",
    passage:
      "Share of electricity generated from wind in Country X\n\n| Year | Share from wind |\n|---|---|\n| 2016 | 4% |\n| 2018 | 7% |\n| 2020 | 11% |\n| 2022 | 12% |\n\nAn energy analyst claims that wind power grew rapidly in Country X at first but that its growth has recently slowed.",
    stem: "Which choice most effectively uses data from the table to support the analyst's claim?",
    correct: "Wind's share rose by 7 percentage points from 2016 to 2020 but by only 1 point from 2020 to 2022.",
    wrong: [
      "Wind's share was 4% in 2016 and 12% in 2022.",
      "Wind's share was higher in 2022 than in any earlier year shown.",
      "Wind's share nearly doubled from 2016 to 2018.",
    ],
    explanation:
      "To show fast early growth followed by a slowdown, a choice has to compare both periods: +7 points (2016–2020) versus +1 point (2020–2022).",
  },
  // ── Inferences ──
  {
    skill: "Inferences",
    difficulty: "MEDIUM",
    passage:
      "Archaeologists excavating a 4,000-year-old settlement found charred wheat and barley seeds in nearly every household. However, grinding stones, which people typically used to turn grain into flour, appeared in only a few large buildings near the center of the settlement. This distribution suggests that ______",
    stem: LOGICAL,
    correct: "grain may have been processed in shared central locations rather than in individual homes.",
    wrong: [
      "residents of the settlement did not eat wheat or barley.",
      "the settlement was abandoned before grain was harvested.",
      "grinding stones were more common than seeds in the settlement.",
    ],
    explanation:
      "Grain was present in almost every home, but the tools for grinding it were found only in a few central buildings, so grinding likely happened centrally.",
  },
  {
    skill: "Inferences",
    difficulty: "HARD",
    passage:
      "The Mexican tetra is a small fish with two forms: one lives in rivers and has fully developed eyes, while the other lives in dark caves and is eyeless. Researchers found that cave-dwelling tetras have far more taste buds on their heads than river-dwelling tetras do. Since there is no light in the caves, the researchers concluded that ______",
    stem: LOGICAL,
    correct: "cave tetras likely rely more on taste than on sight to find food.",
    wrong: [
      "river tetras cannot detect food by taste at all.",
      "cave tetras will regain their eyes if moved to a river.",
      "taste buds allow cave tetras to see in complete darkness.",
    ],
    explanation:
      "Eyes are useless in darkness, and cave tetras have extra taste buds; the logical conclusion is that taste has become more important for finding food.",
  },
  {
    skill: "Inferences",
    difficulty: "MEDIUM",
    passage:
      "When a popular bakery raised the price of its bread by 20 percent, the number of loaves it sold each day barely changed. A nearby bakery that raised its price by the same amount saw its daily sales fall by nearly half. The owner of the first bakery reasoned that ______",
    stem: LOGICAL,
    correct: "her customers valued her bread enough that the higher price did not drive them away.",
    wrong: [
      "the nearby bakery had lowered its prices at the same time.",
      "customers generally prefer to buy bread from the more expensive bakery.",
      "raising prices always increases a bakery's daily sales.",
    ],
    explanation:
      "The first bakery's sales held steady after the price increase, while its competitor's fell — suggesting its customers were especially loyal.",
  },
  // ── Text Structure and Purpose ──
  {
    skill: "Text Structure and Purpose",
    difficulty: "MEDIUM",
    passage:
      "In the fifteenth century, the ruler and astronomer Ulugh Beg built a massive observatory in Samarkand. **Its central instrument was an enormous curved stone arc with a radius of about 40 meters, set into a trench in the ground to keep it perfectly still.** Using it, his team measured the positions of over a thousand stars with an accuracy that would not be surpassed in Europe for more than a century.",
    stem: "Which choice best describes the function of the sentence in bold in the text as a whole?",
    correct: "It describes a feature of the observatory that helps explain its measurements' accuracy.",
    wrong: [
      "It introduces a problem that prevented Ulugh Beg from completing his work.",
      "It compares Ulugh Beg's observatory with observatories in Europe.",
      "It explains why Ulugh Beg chose Samarkand as the location for the observatory.",
    ],
    explanation:
      "The bold sentence describes the huge, fixed instrument; the next sentence says the team achieved remarkable accuracy with it. The detail supports that achievement.",
  },
  {
    skill: "Text Structure and Purpose",
    difficulty: "HARD",
    passage:
      "Many people assume that octopuses, being solitary animals, have no need for complex social skills. Yet researchers observing a site off the coast of Australia recorded octopuses living in close quarters, signaling to one another by changing color and posture, and even evicting neighbors from their dens. These observations suggest that at least some octopuses are more socially flexible than their reputation implies.",
    stem: "Which choice best describes the overall structure of the text?",
    correct: "It presents a common assumption, then describes observations that challenge it.",
    wrong: [
      "It describes an experiment, then explains why the experiment failed.",
      "It lists several animals, then ranks them by intelligence.",
      "It poses a question about octopuses, then admits it cannot be answered.",
    ],
    explanation:
      "The text begins with an assumption (octopuses lack social skills) and then presents evidence of social behavior that complicates it.",
  },
  {
    skill: "Text Structure and Purpose",
    difficulty: "EASY",
    passage:
      "Before the printing press, books in Europe were copied by hand, a process that could take months for a single volume. Johannes Gutenberg's press, developed around 1440, used movable metal type that could be arranged, inked, and pressed repeatedly. Within fifty years, millions of books had been printed, and ideas could spread faster than ever before.",
    stem: "Which choice best states the main purpose of the text?",
    correct: "To explain how the printing press changed the speed at which books and ideas spread",
    wrong: [
      "To argue that handwritten books were more beautiful than printed ones",
      "To describe the life of Johannes Gutenberg before he became an inventor",
      "To compare printing technology in Europe with that in other regions",
    ],
    explanation:
      "The text contrasts slow hand-copying with Gutenberg's press and ends by noting how quickly books and ideas spread afterward.",
  },
  // ── Cross-Text Connections ──
  {
    skill: "Cross-Text Connections",
    difficulty: "HARD",
    passage:
      "**Text 1**\n\nA two-year study of software companies found that employees who worked from home completed more tasks per week than their office-based colleagues. The researchers credited fewer interruptions and the time saved by not commuting.\n\n**Text 2**\n\nMeasuring productivity by the number of tasks completed can be misleading. In many workplaces, the most valuable work comes from unplanned conversations in which colleagues share problems and ideas. Such exchanges happen far less often when employees work remotely, and their loss may not appear in weekly task counts.",
    stem: "Based on the texts, how would the author of Text 2 most likely respond to the findings described in Text 1?",
    correct: "By arguing that counting completed tasks may overlook valuable benefits of working together in person",
    wrong: [
      "By agreeing that remote work is clearly more productive for every kind of company",
      "By claiming that the study in Text 1 did not include enough software companies",
      "By suggesting that commuting time has no effect on employee productivity",
    ],
    explanation:
      "Text 2 says task counts can be misleading because they miss the value of spontaneous in-person conversations — a direct challenge to how Text 1 measured productivity.",
  },
  {
    skill: "Cross-Text Connections",
    difficulty: "MEDIUM",
    passage:
      "**Text 1**\n\nFor much of the twentieth century, scientists pictured dinosaurs as slow, cold-blooded reptiles that depended on outside heat, much like modern lizards.\n\n**Text 2**\n\nAnalyses of fossilized bone show that many dinosaurs grew rapidly, with dense networks of blood vessels similar to those of modern birds and mammals. These features suggest that many dinosaurs generated much of their own body heat.",
    stem: "Based on the texts, how would the author of Text 2 most likely respond to the view described in Text 1?",
    correct: "By asserting that evidence from bone structure suggests many dinosaurs were not like modern lizards in how they produced heat",
    wrong: [
      "By agreeing that dinosaurs depended on outside heat like modern lizards",
      "By arguing that fossilized bone cannot reveal anything about dinosaurs' biology",
      "By claiming that modern birds are more closely related to lizards than to dinosaurs",
    ],
    explanation:
      "Text 2 presents bone evidence that many dinosaurs produced their own heat, contradicting Text 1's picture of cold-blooded, lizard-like dinosaurs.",
  },
  // ── Rhetorical Synthesis ──
  {
    skill: "Rhetorical Synthesis",
    difficulty: "MEDIUM",
    passage: `${NOTES}\n\n- Ulugh Beg (1394–1449) was a ruler of the Timurid Empire.\n- He built an observatory in Samarkand in the 1420s.\n- His star catalogue listed the positions of 1,018 stars.\n- Its measurements were more precise than those of any earlier catalogue.\n- European astronomers did not match its precision until the late 1500s.`,
    stem: "The student wants to emphasize the precision of Ulugh Beg's star catalogue. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    correct: "Ulugh Beg's catalogue of 1,018 stars was more precise than any before it, and European astronomers did not match its precision until the late 1500s.",
    wrong: [
      "Ulugh Beg, who lived from 1394 to 1449, was a ruler of the Timurid Empire.",
      "In the 1420s, Ulugh Beg built an observatory in the city of Samarkand.",
      "Ulugh Beg was both a ruler and an astronomer who built an observatory.",
    ],
    explanation:
      "Only the correct choice focuses on precision: it says the catalogue was more precise than earlier ones and unmatched in Europe for more than a century.",
  },
  {
    skill: "Rhetorical Synthesis",
    difficulty: "EASY",
    passage: `${NOTES}\n\n- Maryam Mirzakhani was an Iranian mathematician.\n- She studied the geometry of curved surfaces.\n- In 2014, she received the Fields Medal, one of the highest honors in mathematics.\n- She was the first woman to receive the Fields Medal.`,
    stem: "The student wants to introduce Mirzakhani to an audience unfamiliar with her. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    correct: "Maryam Mirzakhani, an Iranian mathematician who studied the geometry of curved surfaces, was the first woman to receive the Fields Medal.",
    wrong: [
      "The Fields Medal is one of the highest honors in mathematics.",
      "In 2014, the Fields Medal was awarded to a mathematician.",
      "Mirzakhani received the medal in 2014 for her work.",
    ],
    explanation:
      "An introduction should say who Mirzakhani was and why she matters. The correct choice identifies her, her field and her historic achievement.",
  },
  {
    skill: "Rhetorical Synthesis",
    difficulty: "HARD",
    passage: `${NOTES}\n\n- The Aral Sea was once the fourth-largest lake in the world.\n- Beginning in the 1960s, the Amu Darya and Syr Darya rivers were diverted to irrigate cotton fields.\n- With less river water flowing in, the sea began to shrink rapidly.\n- By the 2010s, it had lost most of its original volume.`,
    stem: "The student wants to explain the main cause of the Aral Sea's decline. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    correct: "Because the rivers that fed the Aral Sea were diverted to irrigate cotton fields starting in the 1960s, the sea began to shrink rapidly.",
    wrong: [
      "The Aral Sea, once the fourth-largest lake in the world, had lost most of its volume by the 2010s.",
      "The Amu Darya and Syr Darya are two rivers in Central Asia.",
      "Cotton fields in the region require large amounts of water.",
    ],
    explanation:
      "The goal is to explain the cause. Only the correct choice links the river diversions for irrigation directly to the sea's shrinking.",
  },
];

// ── Words in Context: [text with blank, correct, wrong×3, explanation] ──
const WIC_ITEMS: [string, string, [string, string, string], string][] = [
  ["The committee's report was so ______ that readers could find every figure they needed without searching through extra material; it was just four pages long yet complete.", "concise", ["verbose", "ambiguous", "tentative"], "\"Concise\" means brief but complete, matching \"four pages long yet complete.\""],
  ["Although critics predicted the new museum would attract few visitors, attendance in its first year proved ______, exceeding the city's most hopeful estimates.", "robust", ["negligible", "erratic", "modest"], "Attendance \"exceeding the most hopeful estimates\" is strong — \"robust.\""],
  ["The scientist was ______ about the early results, noting that the sample was small and that further trials might produce different findings.", "cautious", ["elated", "indifferent", "dismissive"], "Pointing out a small sample and possible different results shows a careful, \"cautious\" attitude."],
  ["The novel's plot is deliberately ______: events are presented out of order, and the reader must piece together what happened.", "fragmented", ["predictable", "chronological", "simplistic"], "Events presented out of order form a \"fragmented\" plot."],
  ["Because the old bridge could no longer ______ the weight of modern trucks, engineers designed a stronger replacement.", "withstand", ["exaggerate", "overlook", "diminish"], "The bridge could not bear, or \"withstand,\" the heavy trucks."],
  ["The mayor's speech was intended to ______ tensions between the two neighborhoods, and residents on both sides praised its calming tone.", "alleviate", ["provoke", "document", "disguise"], "A calming speech would ease, or \"alleviate,\" tensions."],
  ["Historians consider the letter an especially ______ source because it was written by an eyewitness on the day of the event.", "credible", ["obscure", "fictional", "redundant"], "An eyewitness account written the same day is trustworthy, or \"credible.\""],
  ["Unlike her outspoken sister, Nodira was ______, rarely sharing her opinions even among close friends.", "reserved", ["candid", "boisterous", "eloquent"], "The contrast with an \"outspoken\" sister and \"rarely sharing\" opinions points to \"reserved.\""],
  ["The engineer's design was praised as ______, solving a complicated problem with a surprisingly simple mechanism.", "ingenious", ["conventional", "cumbersome", "haphazard"], "Solving a hard problem with a simple, clever mechanism is \"ingenious.\""],
  ["Early reviews of the film were ______, with some critics calling it a masterpiece and others calling it a failure.", "divided", ["unanimous", "delayed", "anonymous"], "Critics disagreeing sharply means the reviews were \"divided.\""],
  ["Drought conditions made the region's water supply increasingly ______, forcing farmers to reduce the amount of land they irrigated.", "scarce", ["abundant", "stagnant", "volatile"], "Farmers irrigating less implies there was little water — it was \"scarce.\""],
  ["The researchers' findings ______ earlier studies, confirming that the medicine was effective in adults.", "corroborated", ["contradicted", "predated", "obscured"], "Findings that confirm earlier studies \"corroborate\" them."],
  ["Though the task seemed ______ at first, the team completed it in a single afternoon once they divided the work.", "daunting", ["trivial", "optional", "familiar"], "\"Though\" signals contrast: the task seemed intimidating (\"daunting\") but was finished quickly."],
  ["The poet's imagery is remarkably ______: a single line can evoke both the scent of rain and the sound of distant thunder.", "vivid", ["vague", "sparse", "detached"], "Imagery that evokes scent and sound strongly is \"vivid.\""],
  ["The documentary offers a ______ account of the expedition, including both its triumphs and its costly mistakes.", "balanced", ["biased", "fictional", "hurried"], "Including both triumphs and mistakes makes the account \"balanced.\""],
  ["Many desert plants are ______ to dry conditions, storing water in thick leaves or stems for long periods.", "adapted", ["vulnerable", "unrelated", "opposed"], "Storing water to survive drought shows the plants are \"adapted\" to dry conditions."],
  ["The architect wanted the library to feel ______, so she used wide windows and high ceilings to fill it with light.", "spacious", ["cramped", "ornate", "temporary"], "Wide windows and high ceilings create an open, \"spacious\" feeling."],
  ["After years of ______ research, the team finally identified the gene responsible for the plant's unusual color.", "painstaking", ["careless", "brief", "accidental"], "Years of careful, thorough work is \"painstaking\" research."],
  ["The negotiator's ______ approach — listening closely and acknowledging each side's concerns — helped the two companies reach an agreement.", "diplomatic", ["aggressive", "secretive", "impulsive"], "Listening and acknowledging concerns is a tactful, \"diplomatic\" approach."],
  ["Some economists argue that the policy's benefits are ______, lasting only a few months before prices return to their previous levels.", "fleeting", ["permanent", "hidden", "cumulative"], "Benefits lasting only a few months are short-lived, or \"fleeting.\""],
];

// ── Transitions: [text before blank, text after blank, correct, wrong×3, explanation] ──
const TRANSITION_ITEMS: [string, string, string, [string, string, string], string][] = [
  ["Most bird species build nests for their eggs.", "the emperor penguin builds no nest at all, balancing its egg on its feet instead.", "By contrast,", ["Similarly,", "As a result,", "For example,"], "The penguin's behavior differs from that of most birds, so a contrasting transition is needed."],
  ["The factory upgraded its machines to use less electricity.", "its monthly energy costs fell by nearly a third.", "As a result,", ["However,", "For instance,", "Likewise,"], "Falling costs are a consequence of using less electricity."],
  ["Honeybees communicate the location of food through a movement called the waggle dance.", "a bee that shakes its body while moving in a straight line signals the direction of the food relative to the sun.", "Specifically,", ["Nevertheless,", "In contrast,", "Therefore,"], "The second sentence gives a precise detail of how the dance works."],
  ["The first draft of the novel took the author ten years to write.", "the sequel was completed in just eighteen months.", "In contrast,", ["Consequently,", "Furthermore,", "For example,"], "Eighteen months contrasts sharply with ten years."],
  ["The city added dozens of new bicycle lanes last spring.", "it lowered bus fares for students and seniors.", "Additionally,", ["Instead,", "Nonetheless,", "Thus,"], "Both sentences list improvements to transportation; the second adds to the first."],
  ["Many early cameras required subjects to sit perfectly still for several minutes.", "people in old photographs often look stiff and serious.", "Consequently,", ["Meanwhile,", "Similarly,", "In contrast,"], "Stiff expressions resulted from the long exposure times."],
  ["Researchers expected the new fertilizer to increase crop yields.", "the treated fields produced slightly less grain than untreated ones.", "However,", ["Moreover,", "Therefore,", "For instance,"], "The result was the opposite of what was expected."],
  ["Several plants have evolved clever ways to spread their seeds.", "the dandelion's seeds are attached to tiny parachutes that the wind carries for kilometers.", "For example,", ["However,", "Finally,", "Consequently,"], "The dandelion is an example of a clever seed-spreading strategy."],
  ["The museum's collection includes paintings from twelve centuries.", "it houses one of the world's largest collections of ancient coins.", "Furthermore,", ["Nevertheless,", "In other words,", "As a result,"], "The second sentence adds another impressive feature of the museum."],
  ["The storm knocked out power across most of the city.", "hospitals, which rely on backup generators, continued operating normally.", "Nevertheless,", ["Therefore,", "Similarly,", "For example,"], "Hospitals continuing to operate is contrary to what the power outage might suggest."],
  ["Coral reefs cover less than one percent of the ocean floor.", "they support roughly a quarter of all marine species.", "Even so,", ["Hence,", "Likewise,", "In fact,"], "Supporting so many species is surprising given the reefs' small area."],
  ["The team spent months testing hundreds of materials for the new battery.", "they chose a lithium compound that stored the most energy for its weight.", "Ultimately,", ["Conversely,", "For instance,", "Similarly,"], "After months of testing, the final choice is introduced — a concluding transition."],
  ["Some languages, such as English, rely heavily on word order to show meaning.", "Uzbek often uses suffixes to show a word's role in a sentence.", "By contrast,", ["As a result,", "Specifically,", "Moreover,"], "The two languages use different strategies, so a contrast is needed."],
  ["The volcano had been silent for centuries.", "scientists were surprised when it began releasing gas in 2021.", "Thus,", ["Nonetheless,", "In contrast,", "For example,"], "The long silence explains the scientists' surprise; the second follows from the first."],
  ["Octopuses can change the color of their skin in a fraction of a second.", "some species can also change the texture of their skin to resemble rocks or coral.", "Moreover,", ["However,", "Therefore,", "Instead,"], "Changing texture is an additional camouflage ability."],
  ["In 1928, Alexander Fleming noticed that mold had killed bacteria in one of his dishes.", "this accidental observation led to the development of penicillin.", "Eventually,", ["In contrast,", "Similarly,", "For instance,"], "The discovery led to penicillin over time — a sequence transition."],
  ["Silk was once so valuable that it was used as currency in parts of China.", "soldiers were sometimes paid in bolts of silk rather than coins.", "In fact,", ["However,", "Conversely,", "Meanwhile,"], "The second sentence intensifies the first with a striking supporting fact."],
  ["The author's early stories were set in large cities.", "she set her stories almost entirely in rural villages.", "Later,", ["Therefore,", "For example,", "Likewise,"], "The sentences describe a change over time in the author's work."],
  ["Solar panels produce the most electricity in bright sunlight.", "their output drops significantly on cloudy days.", "Consequently,", ["Nevertheless,", "For instance,", "Alternatively,"], "Lower output on cloudy days follows logically from needing bright sunlight."],
  ["Some critics dismissed the architect's design as impractical.", "the building has become one of the city's most visited landmarks.", "Still,", ["Therefore,", "Similarly,", "Specifically,"], "The building's success runs counter to the critics' dismissal."],
];

// ── Boundaries & Form, Structure, and Sense: [text with blank, correct, wrong×3, explanation, skill, difficulty] ──
const CONVENTION_ITEMS: [string, string, [string, string, string], string, string, "EASY" | "MEDIUM" | "HARD"][] = [
  ["The researchers collected water samples from twelve mountain ______ results showed that every lake contained microplastics.", "lakes; the", ["lakes, the", "lakes the", "lakes, and, the"], "Two independent clauses must be joined by a semicolon (or a period). A comma alone creates a comma splice.", "Boundaries", "EASY"],
  ["The expedition carried three essential ______ a compass, a satellite phone, and a first-aid kit.", "tools:", ["tools;", "tools", "tools, and"], "A colon introduces a list that follows a complete independent clause.", "Boundaries", "MEDIUM"],
  ["Although the recipe looked simple, the ______ several hours of careful preparation.", "dish required", ["dish, required", "dish; required", "dish: required"], "No punctuation belongs between a subject (\"the dish\") and its verb (\"required\").", "Boundaries", "EASY"],
  ["Samarkand's Registan square is framed by three ______ each decorated with intricate blue tilework.", "madrasas,", ["madrasas;", "madrasas.", "madrasas each:"], "The phrase \"each decorated…\" is a modifier, not an independent clause, so a comma is correct.", "Boundaries", "MEDIUM"],
  ["The chemist Rosalind ______ helped reveal the structure of DNA.", "Franklin", ["Franklin,", "Franklin;", "Franklin:"], "\"Rosalind Franklin\" is an essential name that identifies which chemist; no punctuation separates it from the verb.", "Boundaries", "HARD"],
  ["Many desert animals are active only at ______ the extreme daytime heat would quickly exhaust them.", "night because", ["night, because,", "night; because", "night. Because"], "\"Because the extreme daytime heat…\" is a dependent clause and must stay attached to the main clause without a semicolon or period.", "Boundaries", "MEDIUM"],
  ["The painting had been lost for nearly a ______ it was discovered in an attic in 2019.", "century; then", ["century, then", "century then", "century, then,"], "Two independent clauses (\"The painting had been lost…\" and \"then it was discovered…\") need a semicolon; \"then\" is not a conjunction.", "Boundaries", "HARD"],
  ["My grandmother's ______ is known throughout the neighborhood for its sweet apricots.", "garden", ["garden,", "garden;", "garden —"], "Nothing should separate the subject \"garden\" from its verb \"is.\"", "Boundaries", "EASY"],
  ["Engineer Bakhtiyor Karimov designed the bridge's ______ which allow it to flex slightly during strong winds.", "joints,", ["joints;", "joints.", "joints"], "\"Which allow it to flex…\" is a nonessential relative clause and is set off with a comma.", "Boundaries", "MEDIUM"],
  ["The collection of rare manuscripts ______ displayed in the museum's east wing.", "is", ["are", "were", "have been"], "The subject is the singular \"collection\" (not \"manuscripts\"), so the singular verb \"is\" is required.", "Form, Structure, and Sense", "MEDIUM"],
  ["Each of the students in the robotics club ______ a project for the regional competition.", "is preparing", ["are preparing", "have prepared", "were preparing"], "\"Each\" is singular, so it takes the singular verb \"is preparing.\"", "Form, Structure, and Sense", "MEDIUM"],
  ["Last year, the city council ______ a plan to plant ten thousand trees along major roads.", "approved", ["approves", "will approve", "is approving"], "\"Last year\" signals the past, so the past tense \"approved\" is correct.", "Form, Structure, and Sense", "EASY"],
  ["The bees in the hive ______ their honey in hexagonal wax cells.", "store", ["stores", "is storing", "has stored"], "The subject is the plural \"bees,\" so the plural verb \"store\" agrees with it.", "Form, Structure, and Sense", "EASY"],
  ["When the orchestra finished the final movement, the audience rose to ______ feet.", "its", ["it's", "their's", "they're"], "\"Audience\" is a singular collective noun here, and the possessive form is \"its\" (no apostrophe).", "Form, Structure, and Sense", "HARD"],
  ["Neither the coach nor the players ______ expected the match to last five hours.", "had", ["has", "was", "is"], "With \"neither…nor,\" the verb agrees with the nearer subject, \"players,\" which is plural: \"had.\"", "Form, Structure, and Sense", "HARD"],
  ["The three ______ findings were published in a leading journal last spring.", "scientists'", ["scientist's", "scientists", "scientists's"], "The findings belong to three (plural) scientists, so the plural possessive \"scientists'\" is correct.", "Form, Structure, and Sense", "MEDIUM"],
  ["By the time the rescue team arrived, the hikers ______ for nearly two days.", "had been waiting", ["are waiting", "will wait", "wait"], "An action continuing up to a past moment uses the past perfect progressive \"had been waiting.\"", "Form, Structure, and Sense", "MEDIUM"],
  ["The data from the survey ______ that most residents support the new park.", "suggest", ["suggests that it", "suggesting", "to suggest"], "The sentence needs a main verb; \"data\" is treated as plural in formal writing, so \"suggest\" is correct.", "Form, Structure, and Sense", "HARD"],
];

const ENGLISH_TOPIC: Record<string, string> = {
  "Central Ideas and Details": "Reading comprehension",
  "Command of Evidence": "Reading comprehension",
  Inferences: "Reading comprehension",
  "Text Structure and Purpose": "Reading comprehension",
  "Cross-Text Connections": "Reading comprehension",
  "Rhetorical Synthesis": "Writing",
  "Words in Context": "Vocabulary",
  Transitions: "Linking words",
  Boundaries: "Punctuation",
  "Form, Structure, and Sense": "Grammar",
};

export function generateEnglish(seed = 2024): GenQuestion[] {
  const rng = mulberry32(seed);
  const out: GenQuestion[] = [];
  const add = (q: { skill: string; difficulty: GenQuestion["difficulty"]; passage?: string; stem: string; explanation: string; correct: string; wrong: string[] }) => {
    const { choices, answer } = mcq(rng, q.correct, q.wrong, () => "None of the above");
    out.push({
      subject: "English",
      type: "MCQ",
      topic: ENGLISH_TOPIC[q.skill] ?? q.skill,
      difficulty: q.difficulty,
      passage: q.passage,
      stem: q.stem,
      choices,
      answer,
      explanation: q.explanation,
    });
  };

  for (const item of PASSAGE_ITEMS) add(item);

  WIC_ITEMS.forEach(([text, correct, wrong, explanation], i) =>
    add({
      skill: "Words in Context",
      difficulty: i % 3 === 0 ? "HARD" : i % 3 === 1 ? "MEDIUM" : "EASY",
      passage: text,
      stem: WIC,
      correct,
      wrong,
      explanation,
    }),
  );

  TRANSITION_ITEMS.forEach(([before, after, correct, wrong, explanation], i) =>
    add({
      skill: "Transitions",
      difficulty: i % 3 === 0 ? "MEDIUM" : i % 3 === 1 ? "EASY" : "HARD",
      passage: `${before} ______ ${after}`,
      stem: TRANSITION,
      correct,
      wrong,
      explanation,
    }),
  );

  for (const [text, correct, wrong, explanation, skill, difficulty] of CONVENTION_ITEMS) {
    add({ skill, difficulty, passage: text, stem: CONVENTIONS, correct, wrong, explanation });
  }

  return out;
}
