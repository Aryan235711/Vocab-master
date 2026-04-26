export type WordDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface DictEntry {
  id: string;
  word: string;
  category: string;
  meaning: string;
  hindiMeaning: string;
  exampleSentence: string;
  synonyms: string[];
  antonyms: string[];
  difficulty: WordDifficulty;
  examFrequency: { [exam: string]: number };
  etymology: string;
  pronunciation: string;
}

export const vocab_batch1: DictEntry[] = [
  {
    "id": "v1",
    "word": "ABATE",
    "category": "Vocabulary",
    "meaning": "To become less active, less intense, or less in amount",
    "hindiMeaning": "कम होना (Kam hona)",
    "exampleSentence": "As the monsoon rain began to abate, the rescue operations resumed in the flooded areas.",
    "synonyms": [
      "diminish",
      "decline",
      "subside",
      "lessen"
    ],
    "antonyms": [
      "intensify",
      "increase",
      "aggravate"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 5,
      "IBPS_PO": 7
    },
    "etymology": "From Old French 'abatre' meaning 'to beat down'.",
    "pronunciation": "uh-BAYT"
  },
  {
    "id": "v2",
    "word": "ABERRATION",
    "category": "Vocabulary",
    "meaning": "A departure from what is normal, usual, or expected, typically an unwelcome one",
    "hindiMeaning": "विपथन / असामान्यता (Vipathan / Asamanyata)",
    "exampleSentence": "The sudden drop in inflation was considered an aberration rather than a long-term trend by the RBI.",
    "synonyms": [
      "anomaly",
      "deviation",
      "abnormality"
    ],
    "antonyms": [
      "normality",
      "regularity",
      "conformity"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 9,
      "IBPS_PO": 5
    },
    "etymology": "From Latin 'aberrare', meaning 'to wander away'.",
    "pronunciation": "ab-uh-RAY-shun"
  },
  {
    "id": "v3",
    "word": "ABHOR",
    "category": "Vocabulary",
    "meaning": "To regard with disgust and hatred",
    "hindiMeaning": "घृणा करना (Ghrina karna)",
    "exampleSentence": "A principled civil servant must abhor corruption in all its forms.",
    "synonyms": [
      "detest",
      "hate",
      "loathe",
      "despise"
    ],
    "antonyms": [
      "love",
      "admire",
      "cherish"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 9,
      "UPSC": 4,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'abhorrere' (shudder away from).",
    "pronunciation": "ab-HAWR"
  },
  {
    "id": "v4",
    "word": "ABJECT",
    "category": "Vocabulary",
    "meaning": "Extremely bad, unpleasant, and degrading; completely without pride or dignity",
    "hindiMeaning": "दयनीय (Dayneeya)",
    "exampleSentence": "Despite high economic growth, many marginalized communities still live in abject poverty.",
    "synonyms": [
      "wretched",
      "miserable",
      "hopeless",
      "pathetic"
    ],
    "antonyms": [
      "commendable",
      "exalted",
      "proud"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 8,
      "IBPS_PO": 5
    },
    "etymology": "From Latin 'abjectus', meaning 'thrown away'.",
    "pronunciation": "AB-jekt"
  },
  {
    "id": "v5",
    "word": "ABNEGATION",
    "category": "Vocabulary",
    "meaning": "The act of renouncing or rejecting something",
    "hindiMeaning": "अस्वीकार / त्याग (Asveekar / Tyaag)",
    "exampleSentence": "The minister's absolute abnegation of responsibility outraged the public after the bridge collapse.",
    "synonyms": [
      "renunciation",
      "rejection",
      "relinquishment"
    ],
    "antonyms": [
      "acceptance",
      "indulgence",
      "allowance"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 2,
      "UPSC": 7,
      "IBPS_PO": 3
    },
    "etymology": "From Latin 'abnegare', meaning 'deny'.",
    "pronunciation": "ab-ni-GAY-shun"
  },
  {
    "id": "v6",
    "word": "ABORTIVE",
    "category": "Vocabulary",
    "meaning": "Failing to produce the intended result",
    "hindiMeaning": "निष्फल (Nishphal)",
    "exampleSentence": "The rebels made an abortive attempt to overthrow the government.",
    "synonyms": [
      "unsuccessful",
      "failed",
      "futile",
      "vain"
    ],
    "antonyms": [
      "successful",
      "fruitful",
      "productive"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 5,
      "UPSC": 5,
      "IBPS_PO": 4
    },
    "etymology": "From Latin 'abortivus', referring to premature birth.",
    "pronunciation": "uh-BAWR-tiv"
  },
  {
    "id": "v7",
    "word": "ABRIDGE",
    "category": "Vocabulary",
    "meaning": "To shorten a piece of writing without losing the sense",
    "hindiMeaning": "संक्षिप्त करना (Sankshipt karna)",
    "exampleSentence": "The compiler decided to abridge the massive encyclopedia to make it accessible to students.",
    "synonyms": [
      "shorten",
      "condense",
      "curtail",
      "truncate"
    ],
    "antonyms": [
      "lengthen",
      "expand",
      "extend"
    ],
    "difficulty": "Easy",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 4,
      "IBPS_PO": 6
    },
    "etymology": "From Old French 'abregier' (to shorten).",
    "pronunciation": "uh-BRIJ"
  },
  {
    "id": "v8",
    "word": "ABROGATE",
    "category": "Vocabulary",
    "meaning": "Repeal or do away with a law, right, or formal agreement",
    "hindiMeaning": "रद्द करना / निरस्त करना (Radd karna / Nirast karna)",
    "exampleSentence": "The Parliament voted to abrogate the outdated colonial-era sedition laws.",
    "synonyms": [
      "repeal",
      "revoke",
      "rescind",
      "annul"
    ],
    "antonyms": [
      "institute",
      "introduce",
      "ratify"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 4,
      "UPSC": 10,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'abrogare' (to repeal a law).",
    "pronunciation": "AB-ruh-gayt"
  },
  {
    "id": "v9",
    "word": "ABSCOND",
    "category": "Vocabulary",
    "meaning": "Leave hurriedly and secretly, typically to avoid detection of or arrest for an unlawful action",
    "hindiMeaning": "फरार होना (Faraar hona)",
    "exampleSentence": "The corrupt financial executive attempted to abscond with millions of dollars in embezzled funds.",
    "synonyms": [
      "flee",
      "escape",
      "bolt",
      "decamp"
    ],
    "antonyms": [
      "remain",
      "stay",
      "appear"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 6,
      "IBPS_PO": 7
    },
    "etymology": "From Latin 'abscondere' (hide).",
    "pronunciation": "ab-SKOND"
  },
  {
    "id": "v10",
    "word": "ABSOLVE",
    "category": "Vocabulary",
    "meaning": "Set or declare someone free from blame, guilt, or responsibility",
    "hindiMeaning": "दोषमुक्त करना (Doshmukt karna)",
    "exampleSentence": "The High Court found the evidence insufficient and decided to absolve the accused of all charges.",
    "synonyms": [
      "exonerate",
      "acquit",
      "exculpate",
      "vindicate"
    ],
    "antonyms": [
      "blame",
      "condemn",
      "incriminate"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 8,
      "IBPS_PO": 5
    },
    "etymology": "From Latin 'absolvere' (set free/acquit).",
    "pronunciation": "ub-ZOLV"
  },
  {
    "id": "v11",
    "word": "ABSTEMIOUS",
    "category": "Vocabulary",
    "meaning": "Not self-indulgent, especially when eating and drinking",
    "hindiMeaning": "संयमी (Sanyami)",
    "exampleSentence": "Gandhiji advocated an abstemious lifestyle focused on simplicity and limited material desires.",
    "synonyms": [
      "temperate",
      "abstinent",
      "austere",
      "moderate"
    ],
    "antonyms": [
      "gluttonous",
      "hedonistic",
      "indulgent"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 7,
      "IBPS_PO": 4
    },
    "etymology": "From Latin 'abstemius', from abs- (away) + temetum (liquor).",
    "pronunciation": "ab-STEE-mee-us"
  },
  {
    "id": "v12",
    "word": "ABSTRUSE",
    "category": "Vocabulary",
    "meaning": "Difficult to understand; obscure",
    "hindiMeaning": "अव्यक्त / समझने में कठिन (Avyakt / Samajhne mein kathin)",
    "exampleSentence": "The professor's lectures on quantum physics were so abstruse that most students failed the test.",
    "synonyms": [
      "obscure",
      "arcane",
      "esoteric",
      "perplexing"
    ],
    "antonyms": [
      "clear",
      "obvious",
      "lucid"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 4,
      "UPSC": 8,
      "IBPS_PO": 4
    },
    "etymology": "From Latin 'abstrusus' (put away, hidden).",
    "pronunciation": "ab-STROOS"
  },
  {
    "id": "v13",
    "word": "ABYSMAL",
    "category": "Vocabulary",
    "meaning": "Extremely bad; appalling",
    "hindiMeaning": "बहुत खराब / अताह (Bahut kharab / Ataah)",
    "exampleSentence": "The team's abysmal performance in the finals severely disappointed their fans.",
    "synonyms": [
      "appalling",
      "dreadful",
      "awful",
      "terrible"
    ],
    "antonyms": [
      "superb",
      "excellent",
      "outstanding"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 5,
      "IBPS_PO": 8
    },
    "etymology": "From 'abysm', related to Latin 'abyssus' (bottomless pit).",
    "pronunciation": "uh-BIZ-mul"
  },
  {
    "id": "v14",
    "word": "ACCEDE",
    "category": "Vocabulary",
    "meaning": "Assent or agree to a demand, request, or treaty",
    "hindiMeaning": "मान लेना / सहमत होना (Maan lena / Sahmat hona)",
    "exampleSentence": "Under immense pressure from the striking farmers, the authorities finally decided to accede to their demands.",
    "synonyms": [
      "agree",
      "assent",
      "consent",
      "comply"
    ],
    "antonyms": [
      "refuse",
      "deny",
      "reject"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 9,
      "IBPS_PO": 7
    },
    "etymology": "From Latin 'accedere' (approach, agree).",
    "pronunciation": "ak-SEED"
  },
  {
    "id": "v15",
    "word": "ACCOLADE",
    "category": "Vocabulary",
    "meaning": "An award or privilege granted as a special honor or as an acknowledgment of merit",
    "hindiMeaning": "सम्मान / पुरस्कार (Samman / Puraskar)",
    "exampleSentence": "The scientist received the highest national accolade for his breakthrough research in biotechnology.",
    "synonyms": [
      "honor",
      "award",
      "tribute",
      "recognition"
    ],
    "antonyms": [
      "criticism",
      "reprimand",
      "reproof"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 6,
      "IBPS_PO": 5
    },
    "etymology": "From French 'accolade' (embrace around the neck), originally a knightly induction.",
    "pronunciation": "AK-uh-layd"
  },
  {
    "id": "v16",
    "word": "ACCRETION",
    "category": "Vocabulary",
    "meaning": "The process of growth or increase, typically by the gradual accumulation of additional layers or matter",
    "hindiMeaning": "वृद्धि / जमाव (Vriddhi / Jamaav)",
    "exampleSentence": "The accretion of wealth in the hands of a few billionaires has widened the income inequality gap.",
    "synonyms": [
      "accumulation",
      "gathering",
      "growth",
      "increase"
    ],
    "antonyms": [
      "decrease",
      "reduction",
      "attrition"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 3,
      "UPSC": 8,
      "IBPS_PO": 2
    },
    "etymology": "From Latin 'accretionem' (an increasing).",
    "pronunciation": "uh-KREE-shun"
  },
  {
    "id": "v17",
    "word": "ACERBIC",
    "category": "Vocabulary",
    "meaning": "Sharp and forthright; tasting sour or bitter",
    "hindiMeaning": "तीखा / कड़वा (Teekha / Kadwa)",
    "exampleSentence": "The critic's acerbic review of the new Bollywood movie went viral on social media.",
    "synonyms": [
      "sharp",
      "sarcastic",
      "sardonic",
      "bitter",
      "caustic"
    ],
    "antonyms": [
      "mild",
      "kind",
      "sweet"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 5,
      "UPSC": 7,
      "IBPS_PO": 4
    },
    "etymology": "From Latin 'acerbus' (sour, tasting harsh).",
    "pronunciation": "uh-SUR-bik"
  },
  {
    "id": "v18",
    "word": "ACQUIESCE",
    "category": "Vocabulary",
    "meaning": "Accept something reluctantly but without protest",
    "hindiMeaning": "चुपचाप मान लेना (Chupchaap maan lena)",
    "exampleSentence": "Knowing he was outvoted, the board member chose to acquiesce to the merger rather than stall the process.",
    "synonyms": [
      "yield",
      "submit",
      "comply",
      "consent"
    ],
    "antonyms": [
      "resist",
      "protest",
      "object"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 9,
      "IBPS_PO": 7
    },
    "etymology": "From Latin 'acquiescere' (rest, remain at rest).",
    "pronunciation": "ak-wee-ES"
  },
  {
    "id": "v19",
    "word": "ACRIMONY",
    "category": "Vocabulary",
    "meaning": "Bitterness or ill feeling",
    "hindiMeaning": "कटुता / रूखापन (Katuta / Rukhapan)",
    "exampleSentence": "The debate between the two political leaders dissolved into personal attacks and acrimony.",
    "synonyms": [
      "bitterness",
      "rancor",
      "hostility",
      "spite"
    ],
    "antonyms": [
      "goodwill",
      "friendship",
      "benevolence"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 8,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'acrimonia' (sharpness, pungency).",
    "pronunciation": "AK-ri-moh-nee"
  },
  {
    "id": "v20",
    "word": "ACUMEN",
    "category": "Vocabulary",
    "meaning": "The ability to make good judgments and quick decisions, typically in a particular domain",
    "hindiMeaning": "कुशाग्रता / प्रखरता (Kushagrata / Prakharta)",
    "exampleSentence": "Her brilliant financial acumen allowed her to turn the failing startup into a billion-dollar enterprise.",
    "synonyms": [
      "astuteness",
      "shrewdness",
      "sharpness",
      "insight"
    ],
    "antonyms": [
      "ignorance",
      "ineptness",
      "stupidity"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 7,
      "IBPS_PO": 9
    },
    "etymology": "From Latin 'acumen' (sharpness, point).",
    "pronunciation": "AK-yuh-mun"
  },
  {
    "id": "v21",
    "word": "ACUTE",
    "category": "Vocabulary",
    "meaning": "Present or experienced to a severe or intense degree",
    "hindiMeaning": "तीव्र / गंभीर (Tivra / Gambhir)",
    "exampleSentence": "The metropolitan areas are facing an acute shortage of clean drinking water this summer.",
    "synonyms": [
      "severe",
      "critical",
      "drastic",
      "intense"
    ],
    "antonyms": [
      "mild",
      "dull",
      "moderate"
    ],
    "difficulty": "Easy",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 5,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'acutus' (sharpened).",
    "pronunciation": "uh-KYOOT"
  },
  {
    "id": "v22",
    "word": "ADAMANT",
    "category": "Vocabulary",
    "meaning": "Refusing to be persuaded or to change one's mind",
    "hindiMeaning": "अड़ियल / अटल (Adiyal / Atal)",
    "exampleSentence": "Despite repeated warnings from the local administration, the shopkeeper remained adamant about keeping his illegal extension.",
    "synonyms": [
      "unyielding",
      "inflexible",
      "resolute",
      "stubborn"
    ],
    "antonyms": [
      "flexible",
      "yielding",
      "amenable"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 9,
      "UPSC": 5,
      "IBPS_PO": 7
    },
    "etymology": "From Greek 'adamas' (untameable, invincible).",
    "pronunciation": "AD-uh-munt"
  },
  {
    "id": "v23",
    "word": "ADEPT",
    "category": "Vocabulary",
    "meaning": "Very skilled or proficient at something",
    "hindiMeaning": "निपुण / कुशल (Nipun / Kushal)",
    "exampleSentence": "He is highly adept at navigating complex bureaucratic procedures in government offices.",
    "synonyms": [
      "expert",
      "proficient",
      "skillful",
      "masterful"
    ],
    "antonyms": [
      "inept",
      "clumsy",
      "unskilled"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 4,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'adeptus' (having attained).",
    "pronunciation": "uh-DEPT"
  },
  {
    "id": "v24",
    "word": "ADHERE",
    "category": "Vocabulary",
    "meaning": "Believe in and follow the practices of",
    "hindiMeaning": "पालन करना / चिपकना (Paalan karna / Chipakna)",
    "exampleSentence": "Every candidate must strictly adhere to the examination guidelines provided in the notification.",
    "synonyms": [
      "stick",
      "cling",
      "follow",
      "comply"
    ],
    "antonyms": [
      "flout",
      "ignore",
      "separate"
    ],
    "difficulty": "Easy",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 6,
      "IBPS_PO": 8
    },
    "etymology": "From Latin 'adhaerere' (stick to).",
    "pronunciation": "ad-HEER"
  },
  {
    "id": "v25",
    "word": "ADJUDICATE",
    "category": "Vocabulary",
    "meaning": "Make a formal judgment or decision about a problem or disputed matter",
    "hindiMeaning": "निर्णय करना (Nirnay karna)",
    "exampleSentence": "A special tribunal was formed to adjudicate the long-standing water dispute between the states.",
    "synonyms": [
      "judge",
      "arbitrate",
      "decide",
      "resolve"
    ],
    "antonyms": [
      "equivocate",
      "ignore"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 4,
      "UPSC": 9,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'adjudicare' (award to).",
    "pronunciation": "uh-JOO-di-kayt"
  },
  {
    "id": "v26",
    "word": "ADMONISH",
    "category": "Vocabulary",
    "meaning": "Warn or reprimand someone firmly",
    "hindiMeaning": "धिक्कारना / चेतावनी देना (Dhikkaarna / Chetaavani dena)",
    "exampleSentence": "The judge admonished the lawyer for repeatedly interrupting the witness's testimony.",
    "synonyms": [
      "reprimand",
      "scold",
      "reprove",
      "chide"
    ],
    "antonyms": [
      "praise",
      "commend",
      "applaud"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 6,
      "IBPS_PO": 7
    },
    "etymology": "From Latin 'admonere' (urge by warning).",
    "pronunciation": "ad-MON-ish"
  },
  {
    "id": "v27",
    "word": "ADROIT",
    "category": "Vocabulary",
    "meaning": "Clever or skillful in using the hands or mind",
    "hindiMeaning": "दक्ष / चतुर (Daksh / Chatur)",
    "exampleSentence": "The seasoned politician was adroit at deflecting difficult questions from journalists during press conferences.",
    "synonyms": [
      "skillful",
      "adept",
      "dexterous",
      "nimble"
    ],
    "antonyms": [
      "clumsy",
      "inept",
      "awkward"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 7,
      "IBPS_PO": 5
    },
    "etymology": "From French 'à droit' (according to right/properly).",
    "pronunciation": "uh-DROYT"
  },
  {
    "id": "v28",
    "word": "ADULATION",
    "category": "Vocabulary",
    "meaning": "Obsequious flattery; excessive admiration or praise",
    "hindiMeaning": "अतिप्रशंसा / चापलूसी (Atiprashansa / Chaploosi)",
    "exampleSentence": "The pop star reveled in the blind adulation poured upon him by millions of teenage fans.",
    "synonyms": [
      "flattery",
      "worship",
      "idolization",
      "fawning"
    ],
    "antonyms": [
      "criticism",
      "scorn",
      "abuse"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 5,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'adulatio' (fawning like a dog).",
    "pronunciation": "aj-uh-LAY-shun"
  },
  {
    "id": "v29",
    "word": "ADULTERATE",
    "category": "Vocabulary",
    "meaning": "Render something poorer in quality by adding another substance, typically an inferior one",
    "hindiMeaning": "मिलावट करना (Milavat karna)",
    "exampleSentence": "The rogue dairy owner was arrested for attempting to adulterate milk with unsafe chemicals to increase margins.",
    "synonyms": [
      "contaminate",
      "spoil",
      "taint",
      "debase"
    ],
    "antonyms": [
      "purify",
      "refine",
      "cleanse"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 6,
      "IBPS_PO": 5
    },
    "etymology": "From Latin 'adulterare' (corrupt).",
    "pronunciation": "uh-DUL-tuh-rayt"
  },
  {
    "id": "v30",
    "word": "ADVOCATE",
    "category": "Vocabulary",
    "meaning": "A person who publicly supports or recommends a particular cause or policy",
    "hindiMeaning": "समर्थक / वकील (Samarthak / Wakeel)",
    "exampleSentence": "He has been a lifelong advocate for free public education in rural India.",
    "synonyms": [
      "supporter",
      "champion",
      "proponent",
      "campaigner"
    ],
    "antonyms": [
      "opponent",
      "critic",
      "enemy"
    ],
    "difficulty": "Easy",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 8,
      "IBPS_PO": 7
    },
    "etymology": "From Latin 'advocatus' (called to aid).",
    "pronunciation": "AD-vuh-kit (noun) / AD-vuh-kayt (verb)"
  },
  {
    "id": "v31",
    "word": "AESTHETIC",
    "category": "Vocabulary",
    "meaning": "Concerned with beauty or the appreciation of beauty",
    "hindiMeaning": "सौंदर्यपरक (Saundaryaparak)",
    "exampleSentence": "The ancient temple in Karnataka is not only spiritually significant but also holds immense aesthetic value.",
    "synonyms": [
      "beautiful",
      "artistic",
      "tasteful",
      "visual"
    ],
    "antonyms": [
      "unattractive",
      "ugly",
      "displeasing"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 7,
      "IBPS_PO": 4
    },
    "etymology": "From Greek 'aisthētikos' (sensitive, perceptive).",
    "pronunciation": "es-THET-ik"
  },
  {
    "id": "v32",
    "word": "AFFABLE",
    "category": "Vocabulary",
    "meaning": "Friendly, good-natured, or easy to talk to",
    "hindiMeaning": "मिलनसार (Milansaar)",
    "exampleSentence": "Despite his high rank and immense wealth, the CEO was incredibly affable to junior employees.",
    "synonyms": [
      "amiable",
      "friendly",
      "genial",
      "cordial"
    ],
    "antonyms": [
      "surly",
      "hostile",
      "unfriendly"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 5,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'affabilis' (easy to speak to).",
    "pronunciation": "AF-uh-bul"
  },
  {
    "id": "v33",
    "word": "AFFECTATION",
    "category": "Vocabulary",
    "meaning": "Behavior, speech, or writing that is artificial and designed to impress",
    "hindiMeaning": "दिखावा / ढोंग (Dikhawa / Dhong)",
    "exampleSentence": "His bizarre British accent was widely seen as an affectation picked up during his one-week trip to London.",
    "synonyms": [
      "pretension",
      "posturing",
      "facade",
      "sham"
    ],
    "antonyms": [
      "naturalness",
      "sincerity",
      "honesty"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 5,
      "UPSC": 6,
      "IBPS_PO": 4
    },
    "etymology": "From Latin 'affectatio' (striving after).",
    "pronunciation": "af-ek-TAY-shun"
  },
  {
    "id": "v34",
    "word": "AFFINITY",
    "category": "Vocabulary",
    "meaning": "A spontaneous or natural liking or sympathy for someone or something",
    "hindiMeaning": "लगाव / आकर्षण (Lagaav / Aakarshan)",
    "exampleSentence": "Growing up near the coast, she developed a deep affinity for marine life.",
    "synonyms": [
      "empathy",
      "rapport",
      "sympathy",
      "fondness"
    ],
    "antonyms": [
      "aversion",
      "dislike",
      "antipathy"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 6,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'affinitas' (bordering on).",
    "pronunciation": "uh-FIN-i-tee"
  },
  {
    "id": "v35",
    "word": "AFFLUENT",
    "category": "Vocabulary",
    "meaning": "Having a great deal of money; wealthy",
    "hindiMeaning": "समृद्ध / धनी (Samriddh / Dhanee)",
    "exampleSentence": "The proliferation of luxury car showrooms indicates the growing population of affluent families in the city.",
    "synonyms": [
      "wealthy",
      "rich",
      "prosperous",
      "well-off"
    ],
    "antonyms": [
      "poor",
      "destitute",
      "impoverished"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 9,
      "UPSC": 7,
      "IBPS_PO": 8
    },
    "etymology": "From Latin 'affluentem' (flowing toward, overflowing in abundance).",
    "pronunciation": "AF-loo-unt"
  },
  {
    "id": "v36",
    "word": "ALACRITY",
    "category": "Vocabulary",
    "meaning": "Brisk and cheerful readiness",
    "hindiMeaning": "तत्परता (Tatparta)",
    "exampleSentence": "She accepted the promotion with alacrity, ready for the challenges of senior management.",
    "synonyms": [
      "eagerness",
      "willingness",
      "readiness",
      "enthusiasm"
    ],
    "antonyms": [
      "apathy",
      "reluctance",
      "hesitation"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 7,
      "IBPS_PO": 5
    },
    "etymology": "From Latin 'alacritas' (lively, brisk).",
    "pronunciation": "uh-LAK-ri-tee"
  },
  {
    "id": "v37",
    "word": "ALLAY",
    "category": "Vocabulary",
    "meaning": "Diminish or put at rest (fear, suspicion, or worry)",
    "hindiMeaning": "शांत करना / कम करना (Shaant karna / Kam karna)",
    "exampleSentence": "The government launched a public awareness campaign to allay fears about the safety of the new vaccine.",
    "synonyms": [
      "reduce",
      "alleviate",
      "assuage",
      "calm"
    ],
    "antonyms": [
      "increase",
      "intensify",
      "provoke"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 6,
      "IBPS_PO": 7
    },
    "etymology": "From Old English 'ālecgan' (to lay down).",
    "pronunciation": "uh-LAY"
  },
  {
    "id": "v38",
    "word": "ALLEGE",
    "category": "Vocabulary",
    "meaning": "Claim or assert that someone has done something illegal or wrong, typically without proof",
    "hindiMeaning": "आरोप लगाना (Aarop lagana)",
    "exampleSentence": "The opposition party continues to allege massive discrepancies in the electoral funding bonds.",
    "synonyms": [
      "claim",
      "assert",
      "charge",
      "declare"
    ],
    "antonyms": [
      "deny",
      "withdraw",
      "retract"
    ],
    "difficulty": "Easy",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 8,
      "IBPS_PO": 8
    },
    "etymology": "From Latin 'allegare' (dispatch on a mission, bring forward in evidence).",
    "pronunciation": "uh-LEJ"
  },
  {
    "id": "v39",
    "word": "ALTERCATION",
    "category": "Vocabulary",
    "meaning": "A noisy argument or disagreement, especially in public",
    "hindiMeaning": "कहा-सुनी / विवाद (Kaha-suni / వివాద)",
    "exampleSentence": "A minor traffic accident quickly escalated into a violent altercation between the two drivers.",
    "synonyms": [
      "argument",
      "quarrel",
      "squabble",
      "dispute"
    ],
    "antonyms": [
      "agreement",
      "harmony",
      "peace"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 5,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'altercari' (to dispute).",
    "pronunciation": "awl-ter-KAY-shun"
  },
  {
    "id": "v40",
    "word": "ALTRUISM",
    "category": "Vocabulary",
    "meaning": "The belief in or practice of disinterested and selfless concern for the well-being of others",
    "hindiMeaning": "परोपकार (Paropkaar)",
    "exampleSentence": "The NGO's operations are entirely funded through the altruism of anonymous donors.",
    "synonyms": [
      "selflessness",
      "philanthropy",
      "charity",
      "benevolence"
    ],
    "antonyms": [
      "selfishness",
      "egoism",
      "greed"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 9,
      "IBPS_PO": 7
    },
    "etymology": "Coined by French philosopher Auguste Comte from Latin 'alter' (other).",
    "pronunciation": "AL-troo-iz-um"
  },
  {
    "id": "v41",
    "word": "AMALGAMATE",
    "category": "Vocabulary",
    "meaning": "Combine or unite to form one organization or structure",
    "hindiMeaning": "मिश्रित करना / मिलाना (Mishrit karna / Milana)",
    "exampleSentence": "The cabinet approved the proposal to amalgamate three distinct public sector banks into one giant entity.",
    "synonyms": [
      "combine",
      "merge",
      "unite",
      "integrate"
    ],
    "antonyms": [
      "separate",
      "divide",
      "split"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 6,
      "IBPS_PO": 9
    },
    "etymology": "From Medieval Latin 'amalgamare' (to form into a soft mixture).",
    "pronunciation": "uh-MAL-guh-mayt"
  },
  {
    "id": "v42",
    "word": "AMBIGUOUS",
    "category": "Vocabulary",
    "meaning": "Open to more than one interpretation; not having one obvious meaning",
    "hindiMeaning": "अस्पष्ट (Aspasht)",
    "exampleSentence": "The ambiguous wording of the tax clause caused widespread confusion among chartered accountants.",
    "synonyms": [
      "equivocal",
      "unclear",
      "vague",
      "cryptic"
    ],
    "antonyms": [
      "clear",
      "explicit",
      "lucid",
      "unequivocal"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 9,
      "UPSC": 8,
      "IBPS_PO": 9
    },
    "etymology": "From Latin 'ambiguus' (doubtful, going about).",
    "pronunciation": "am-BIG-yoo-us"
  },
  {
    "id": "v43",
    "word": "AMBIVALENT",
    "category": "Vocabulary",
    "meaning": "Having mixed feelings or contradictory ideas about something or someone",
    "hindiMeaning": "उभयभावी / दुविधा में (Ubhaybhaavi / Duvidha mein)",
    "exampleSentence": "Many voters felt ambivalent about the new policy, recognizing its economic benefits but fearing its social cost.",
    "synonyms": [
      "uncertain",
      "unsure",
      "doubtful",
      "conflicted"
    ],
    "antonyms": [
      "certain",
      "decisive",
      "resolute"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 7,
      "UPSC": 9,
      "IBPS_PO": 8
    },
    "etymology": "From Latin 'ambi-' (both) + 'valentia' (strength).",
    "pronunciation": "am-BIV-uh-lunt"
  },
  {
    "id": "v44",
    "word": "AMELIORATE",
    "category": "Vocabulary",
    "meaning": "Make (something bad or unsatisfactory) better",
    "hindiMeaning": "सुधारना (Sudhaarna)",
    "exampleSentence": "Local authorities took urgent steps to ameliorate the horrible living conditions in the refugee camps.",
    "synonyms": [
      "improve",
      "enhance",
      "better",
      "upgrade"
    ],
    "antonyms": [
      "worsen",
      "exacerbate",
      "deteriorate"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 9,
      "IBPS_PO": 7
    },
    "etymology": "From Latin 'melior' (better).",
    "pronunciation": "uh-MEEL-yuh-rayt"
  },
  {
    "id": "v45",
    "word": "AMENABLE",
    "category": "Vocabulary",
    "meaning": "Open and responsive to suggestion; easily persuaded or controlled",
    "hindiMeaning": "आज्ञाकारी / उत्तरदायी (Aagyakaari / Uttardaayi)",
    "exampleSentence": "The manager was remarkably amenable to the union's requested changes in the holiday schedule.",
    "synonyms": [
      "compliant",
      "manageable",
      "responsive",
      "flexible"
    ],
    "antonyms": [
      "stubborn",
      "intractable",
      "uncooperative"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 6,
      "UPSC": 7,
      "IBPS_PO": 6
    },
    "etymology": "From Old French 'amener' (bring to).",
    "pronunciation": "uh-MEE-nuh-bul"
  },
  {
    "id": "v46",
    "word": "AMIABLE",
    "category": "Vocabulary",
    "meaning": "Having or displaying a friendly and pleasant manner",
    "hindiMeaning": "सौम्य / मिलनसार (Saumya / Milansaar)",
    "exampleSentence": "Despite the high-stakes negotiations, the diplomats maintained an amiable atmosphere throughout the meeting.",
    "synonyms": [
      "friendly",
      "affable",
      "cordial",
      "pleasant"
    ],
    "antonyms": [
      "hostile",
      "unfriendly",
      "disagreeable"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 5,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'amicabilis' (friendly).",
    "pronunciation": "AY-mee-uh-bul"
  },
  {
    "id": "v47",
    "word": "ANACHRONISM",
    "category": "Vocabulary",
    "meaning": "A thing belonging or appropriate to a period other than that in which it exists, especially a thing that is conspicuously old-fashioned",
    "hindiMeaning": "कालदोष (Kaaldosh)",
    "exampleSentence": "In the era of rapid digital transactions, the complex multi-page paper ledger seemed a blatant anachronism.",
    "synonyms": [
      "archaism",
      "misdating",
      "relic"
    ],
    "antonyms": [
      "modernity",
      "current fashion"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 5,
      "UPSC": 8,
      "IBPS_PO": 4
    },
    "etymology": "From Greek 'anachronismos', ana- (backwards) + chronos (time).",
    "pronunciation": "uh-NAK-ruh-niz-um"
  },
  {
    "id": "v48",
    "word": "ANATHEMA",
    "category": "Vocabulary",
    "meaning": "Something or someone that one vehemently dislikes",
    "hindiMeaning": "अभिशाप / अप्रिय वस्तु (Abhishaap / Apriya Vastu)",
    "exampleSentence": "The idea of compromising national security for short-term economic gain was anathema to the defense strategist.",
    "synonyms": [
      "abomination",
      "outrage",
      "disgrace",
      "bane"
    ],
    "antonyms": [
      "love",
      "blessing",
      "delight"
    ],
    "difficulty": "Hard",
    "examFrequency": {
      "SSC_CGL": 3,
      "UPSC": 8,
      "IBPS_PO": 3
    },
    "etymology": "From Greek 'anathema' (thing devoted to evil).",
    "pronunciation": "uh-NATH-uh-muh"
  },
  {
    "id": "v49",
    "word": "ANIMOSITY",
    "category": "Vocabulary",
    "meaning": "Strong hostility",
    "hindiMeaning": "शत्रुता / बैर (Shatruta / Bair)",
    "exampleSentence": "The deep animosity between the two rival corporate houses resulted in a massive decade-long legal battle.",
    "synonyms": [
      "hostility",
      "friction",
      "antagonism",
      "enmity"
    ],
    "antonyms": [
      "goodwill",
      "friendship",
      "amity"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 6,
      "IBPS_PO": 6
    },
    "etymology": "From Latin 'animositas' (boldness, strong feeling).",
    "pronunciation": "an-uh-MOS-i-tee"
  },
  {
    "id": "v50",
    "word": "ANOMALY",
    "category": "Vocabulary",
    "meaning": "Something that deviates from what is standard, normal, or expected",
    "hindiMeaning": "अराजकता / विसंगति (Araajakta / Visangati)",
    "exampleSentence": "Researchers investigating the climate data noticed a stark anomaly in the temperature readings from the 1990s.",
    "synonyms": [
      "oddity",
      "peculiarity",
      "abnormality",
      "irregularity"
    ],
    "antonyms": [
      "normality",
      "regularity",
      "standard"
    ],
    "difficulty": "Medium",
    "examFrequency": {
      "SSC_CGL": 8,
      "UPSC": 9,
      "IBPS_PO": 8
    },
    "etymology": "From Greek 'anōmalia' (unevenness).",
    "pronunciation": "uh-NOM-uh-lee"
  }
];
