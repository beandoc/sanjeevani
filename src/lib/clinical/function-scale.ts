/**
 * Standardized Functional Independence Engine for the Care Recipient
 * Supporting the Barthel Index of ADLs (Mahoney & Barthel, 0-100) and the
 * Lawton-Brody IADL Scale (0-8).
 * Multilingual Support: English (en), Hindi (hi), Marathi (mr)
 *
 * This is the patient-side counterpart to `zarit-scale.ts`. Where the Zarit
 * engine measures caregiver strain (higher = worse), this measures care-recipient
 * independence (higher = better). Trajectory analytics inverts Barthel into a
 * dependency percentage so both curves move in the same direction.
 */

export type FunctionInstrument = 'BARTHEL' | 'LAWTON';
export type DependencyBand =
  | 'independent'
  | 'slight'
  | 'moderate'
  | 'severe'
  | 'total';

export interface FunctionOption {
  value: number;
  label: { en: string; hi: string; mr: string };
}

export interface FunctionItem {
  id: string;
  number: number;
  /** Care domain — used to explain *which* capability is driving decline. */
  domain:
    | 'self_care'
    | 'continence'
    | 'mobility'
    | 'household'
    | 'community'
    | 'cognitive_executive';
  text: { en: string; hi: string; mr: string };
  options: FunctionOption[];
  /**
   * Loss of this item disproportionately raises hands-on caregiver hours.
   * Used to flag care-demand escalation even when the total score moves little.
   */
  isCareIntensityDriver?: boolean;
}

/* ------------------------------------------------------------------ *
 * BARTHEL INDEX — 10 items, total 0-100 in 5-point increments
 * Mahoney FI, Barthel DW. Md State Med J. 1965;14:61-65.
 * ------------------------------------------------------------------ */

export const BARTHEL_ITEMS: FunctionItem[] = [
  {
    id: 'bi_feeding',
    number: 1,
    domain: 'self_care',
    text: {
      en: 'Feeding',
      hi: 'भोजन करना',
      mr: 'जेवण करणे'
    },
    options: [
      { value: 0, label: { en: 'Unable', hi: 'असमर्थ', mr: 'अक्षम' } },
      { value: 5, label: { en: 'Needs help cutting, spreading butter, etc.', hi: 'काटने/परोसने में मदद चाहिए', mr: 'कापण्यास/वाढण्यास मदत लागते' } },
      { value: 10, label: { en: 'Independent', hi: 'स्वतंत्र', mr: 'स्वतंत्र' } }
    ]
  },
  {
    id: 'bi_bathing',
    number: 2,
    domain: 'self_care',
    text: {
      en: 'Bathing',
      hi: 'नहाना',
      mr: 'अंघोळ करणे'
    },
    options: [
      { value: 0, label: { en: 'Dependent', hi: 'दूसरों पर निर्भर', mr: 'परावलंबी' } },
      { value: 5, label: { en: 'Independent (or in shower)', hi: 'स्वतंत्र', mr: 'स्वतंत्र' } }
    ]
  },
  {
    id: 'bi_grooming',
    number: 3,
    domain: 'self_care',
    text: {
      en: 'Grooming (face, hair, teeth, shaving)',
      hi: 'साज-सज्जा (चेहरा, बाल, दांत, दाढ़ी)',
      mr: 'स्वच्छता (चेहरा, केस, दात, दाढी)'
    },
    options: [
      { value: 0, label: { en: 'Needs help with personal care', hi: 'मदद चाहिए', mr: 'मदत लागते' } },
      { value: 5, label: { en: 'Independent', hi: 'स्वतंत्र', mr: 'स्वतंत्र' } }
    ]
  },
  {
    id: 'bi_dressing',
    number: 4,
    domain: 'self_care',
    text: {
      en: 'Dressing',
      hi: 'कपड़े पहनना',
      mr: 'कपडे घालणे'
    },
    options: [
      { value: 0, label: { en: 'Dependent', hi: 'दूसरों पर निर्भर', mr: 'परावलंबी' } },
      { value: 5, label: { en: 'Needs help but can do about half unaided', hi: 'आधा काम स्वयं कर सकते हैं', mr: 'अर्धे काम स्वतः करू शकतात' } },
      { value: 10, label: { en: 'Independent (buttons, zips, laces)', hi: 'पूर्णतः स्वतंत्र', mr: 'पूर्णपणे स्वतंत्र' } }
    ]
  },
  {
    id: 'bi_bowels',
    number: 5,
    domain: 'continence',
    text: {
      en: 'Bowel control',
      hi: 'मल त्याग पर नियंत्रण',
      mr: 'शौचावर नियंत्रण'
    },
    options: [
      { value: 0, label: { en: 'Incontinent (or needs enemas)', hi: 'नियंत्रण नहीं', mr: 'नियंत्रण नाही' } },
      { value: 5, label: { en: 'Occasional accident', hi: 'कभी-कभी चूक', mr: 'क्वचित चूक' } },
      { value: 10, label: { en: 'Continent', hi: 'पूर्ण नियंत्रण', mr: 'पूर्ण नियंत्रण' } }
    ],
    isCareIntensityDriver: true
  },
  {
    id: 'bi_bladder',
    number: 6,
    domain: 'continence',
    text: {
      en: 'Bladder control',
      hi: 'मूत्र पर नियंत्रण',
      mr: 'लघवीवर नियंत्रण'
    },
    options: [
      { value: 0, label: { en: 'Incontinent or catheterised and unable to manage', hi: 'नियंत्रण नहीं', mr: 'नियंत्रण नाही' } },
      { value: 5, label: { en: 'Occasional accident', hi: 'कभी-कभी चूक', mr: 'क्वचित चूक' } },
      { value: 10, label: { en: 'Continent', hi: 'पूर्ण नियंत्रण', mr: 'पूर्ण नियंत्रण' } }
    ],
    isCareIntensityDriver: true
  },
  {
    id: 'bi_toilet',
    number: 7,
    domain: 'self_care',
    text: {
      en: 'Toilet use',
      hi: 'शौचालय का उपयोग',
      mr: 'शौचालयाचा वापर'
    },
    options: [
      { value: 0, label: { en: 'Dependent', hi: 'दूसरों पर निर्भर', mr: 'परावलंबी' } },
      { value: 5, label: { en: 'Needs some help', hi: 'कुछ मदद चाहिए', mr: 'थोडी मदत लागते' } },
      { value: 10, label: { en: 'Independent (on and off, dressing, wiping)', hi: 'पूर्णतः स्वतंत्र', mr: 'पूर्णपणे स्वतंत्र' } }
    ],
    isCareIntensityDriver: true
  },
  {
    id: 'bi_transfer',
    number: 8,
    domain: 'mobility',
    text: {
      en: 'Transfers (bed to chair and back)',
      hi: 'बिस्तर से कुर्सी तक जाना',
      mr: 'अंथरुणावरून खुर्चीवर जाणे'
    },
    options: [
      { value: 0, label: { en: 'Unable, no sitting balance', hi: 'असमर्थ, बैठ नहीं सकते', mr: 'अक्षम, बसू शकत नाहीत' } },
      { value: 5, label: { en: 'Major help (one or two people, physical)', hi: 'दो लोगों की मदद चाहिए', mr: 'दोन व्यक्तींची मदत लागते' } },
      { value: 10, label: { en: 'Minor help (verbal or physical)', hi: 'थोड़ी मदद चाहिए', mr: 'थोडी मदत लागते' } },
      { value: 15, label: { en: 'Independent', hi: 'स्वतंत्र', mr: 'स्वतंत्र' } }
    ],
    isCareIntensityDriver: true
  },
  {
    id: 'bi_mobility',
    number: 9,
    domain: 'mobility',
    text: {
      en: 'Mobility on level surfaces',
      hi: 'समतल जगह पर चलना',
      mr: 'सपाट जागी चालणे'
    },
    options: [
      { value: 0, label: { en: 'Immobile or < 50 yards', hi: 'चल नहीं सकते', mr: 'चालू शकत नाहीत' } },
      { value: 5, label: { en: 'Wheelchair independent, including corners', hi: 'व्हीलचेयर से स्वतंत्र', mr: 'व्हीलचेअरने स्वतंत्र' } },
      { value: 10, label: { en: 'Walks with help of one person', hi: 'एक व्यक्ति की मदद से चलते हैं', mr: 'एका व्यक्तीच्या मदतीने चालतात' } },
      { value: 15, label: { en: 'Independent (may use aid)', hi: 'स्वतंत्र (छड़ी के साथ भी)', mr: 'स्वतंत्र (काठीसह असले तरी)' } }
    ],
    isCareIntensityDriver: true
  },
  {
    id: 'bi_stairs',
    number: 10,
    domain: 'mobility',
    text: {
      en: 'Stairs',
      hi: 'सीढ़ियाँ चढ़ना',
      mr: 'जिने चढणे'
    },
    options: [
      { value: 0, label: { en: 'Unable', hi: 'असमर्थ', mr: 'अक्षम' } },
      { value: 5, label: { en: 'Needs help (verbal, physical, carrying aid)', hi: 'मदद चाहिए', mr: 'मदत लागते' } },
      { value: 10, label: { en: 'Independent', hi: 'स्वतंत्र', mr: 'स्वतंत्र' } }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * LAWTON-BRODY IADL — 8 items, total 0-8
 * Lawton MP, Brody EM. Gerontologist. 1969;9:179-186.
 *
 * The original scoring convention scored only 5 of 8 domains for men
 * (omitting food preparation, housekeeping, laundry). That convention is
 * not defensible today and makes serial comparison impossible if the
 * denominator changes. We score all 8 items and record the convention.
 * ------------------------------------------------------------------ */

export const LAWTON_ITEMS: FunctionItem[] = [
  {
    id: 'iadl_phone',
    number: 1,
    domain: 'community',
    text: {
      en: 'Ability to use the telephone',
      hi: 'टेलीफोन का उपयोग करने की क्षमता',
      mr: 'दूरध्वनी वापरण्याची क्षमता'
    },
    options: [
      { value: 0, label: { en: 'Does not use telephone at all', hi: 'बिल्कुल उपयोग नहीं कर सकते', mr: 'अजिबात वापरू शकत नाहीत' } },
      { value: 1, label: { en: 'Operates telephone independently', hi: 'स्वयं उपयोग कर सकते हैं', mr: 'स्वतः वापरू शकतात' } }
    ]
  },
  {
    id: 'iadl_shopping',
    number: 2,
    domain: 'community',
    text: {
      en: 'Shopping',
      hi: 'खरीदारी करना',
      mr: 'खरेदी करणे'
    },
    options: [
      { value: 0, label: { en: 'Needs to be accompanied, or completely unable', hi: 'साथ जाना पड़ता है या असमर्थ', mr: 'सोबत जावे लागते किंवा अक्षम' } },
      { value: 1, label: { en: 'Takes care of all shopping needs independently', hi: 'स्वयं सारी खरीदारी कर सकते हैं', mr: 'स्वतः सर्व खरेदी करू शकतात' } }
    ]
  },
  {
    id: 'iadl_food',
    number: 3,
    domain: 'household',
    text: {
      en: 'Food preparation',
      hi: 'भोजन बनाना',
      mr: 'स्वयंपाक करणे'
    },
    options: [
      { value: 0, label: { en: 'Needs meals prepared and served', hi: 'भोजन बनाकर देना पड़ता है', mr: 'जेवण बनवून द्यावे लागते' } },
      { value: 1, label: { en: 'Plans and prepares adequate meals independently', hi: 'स्वयं भोजन बना सकते हैं', mr: 'स्वतः स्वयंपाक करू शकतात' } }
    ]
  },
  {
    id: 'iadl_housekeeping',
    number: 4,
    domain: 'household',
    text: {
      en: 'Housekeeping',
      hi: 'घर की साफ-सफाई',
      mr: 'घरकाम'
    },
    options: [
      { value: 0, label: { en: 'Does not participate in any housekeeping', hi: 'कोई काम नहीं कर सकते', mr: 'कोणतेही काम करू शकत नाहीत' } },
      { value: 1, label: { en: 'Maintains house alone or with occasional assistance', hi: 'स्वयं या थोड़ी मदद से घर संभालते हैं', mr: 'स्वतः किंवा थोड्या मदतीने घर सांभाळतात' } }
    ]
  },
  {
    id: 'iadl_laundry',
    number: 5,
    domain: 'household',
    text: {
      en: 'Laundry',
      hi: 'कपड़े धोना',
      mr: 'कपडे धुणे'
    },
    options: [
      { value: 0, label: { en: 'All laundry must be done by others', hi: 'दूसरों को करना पड़ता है', mr: 'इतरांना करावे लागते' } },
      { value: 1, label: { en: 'Does personal laundry completely', hi: 'स्वयं कपड़े धो सकते हैं', mr: 'स्वतः कपडे धुऊ शकतात' } }
    ]
  },
  {
    id: 'iadl_transport',
    number: 6,
    domain: 'community',
    text: {
      en: 'Mode of transportation',
      hi: 'आवागमन के साधन',
      mr: 'प्रवासाची साधने'
    },
    options: [
      { value: 0, label: { en: 'Does not travel at all, or travel limited to assisted vehicle', hi: 'बिना मदद यात्रा नहीं कर सकते', mr: 'मदतीशिवाय प्रवास करू शकत नाहीत' } },
      { value: 1, label: { en: 'Travels independently by public transport or drives own car', hi: 'स्वयं यात्रा कर सकते हैं', mr: 'स्वतः प्रवास करू शकतात' } }
    ]
  },
  {
    id: 'iadl_medication',
    number: 7,
    domain: 'cognitive_executive',
    text: {
      en: 'Responsibility for own medications',
      hi: 'अपनी दवाइयों की जिम्मेदारी',
      mr: 'स्वतःच्या औषधांची जबाबदारी'
    },
    options: [
      { value: 0, label: { en: 'Not capable of dispensing own medication', hi: 'स्वयं दवा नहीं ले सकते', mr: 'स्वतः औषध घेऊ शकत नाहीत' } },
      { value: 1, label: { en: 'Responsible for taking medication in correct dosage at correct time', hi: 'सही समय व मात्रा में स्वयं दवा लेते हैं', mr: 'योग्य वेळी व प्रमाणात स्वतः औषध घेतात' } }
    ],
    isCareIntensityDriver: true
  },
  {
    id: 'iadl_finances',
    number: 8,
    domain: 'cognitive_executive',
    text: {
      en: 'Ability to handle finances',
      hi: 'पैसों का प्रबंधन',
      mr: 'आर्थिक व्यवहार सांभाळणे'
    },
    options: [
      { value: 0, label: { en: 'Incapable of handling money', hi: 'पैसों का प्रबंधन नहीं कर सकते', mr: 'पैशांचे व्यवहार करू शकत नाहीत' } },
      { value: 1, label: { en: 'Manages financial matters independently', hi: 'स्वयं प्रबंधन कर सकते हैं', mr: 'स्वतः व्यवहार करू शकतात' } }
    ],
    isCareIntensityDriver: true
  }
];

export const BARTHEL_MAX = 100;
export const LAWTON_MAX = 8;

export interface FunctionDomainDetail {
  domain: FunctionItem['domain'];
  rawScore: number;
  maxScore: number;
  percentage: number;
}

export interface FunctionEvaluationResult {
  /** Barthel total, 0-100. Higher = more independent. */
  barthelScore: number;
  barthelMax: number;
  /** Lawton total, 0-8. Higher = more independent. */
  lawtonScore: number;
  lawtonMax: number;
  /**
   * Barthel expressed as dependency (100 - barthel), 0-100, higher = worse.
   * This is the value plotted against caregiver burden so both curves rise together.
   */
  dependencyPercentage: number;
  band: DependencyBand;
  classification: { en: string; hi: string; mr: string };
  domainBreakdown: FunctionDomainDetail[];
  /** Items lost that disproportionately drive hands-on caregiving hours. */
  careIntensityFlags: string[];
  /** All 8 Lawton items were scored — recorded so serial comparisons stay valid. */
  lawtonConvention: 'all-8';
  recordedAt: string;
  encounterId?: string;
}

/**
 * Barthel dependency bands.
 * Shah S, Vanclay F, Cooper B. J Clin Epidemiol. 1989;42(8):703-709.
 */
export function getBarthelBand(score: number): DependencyBand {
  if (score <= 20) return 'total';
  if (score <= 60) return 'severe';
  if (score <= 90) return 'moderate';
  if (score <= 99) return 'slight';
  return 'independent';
}

const BAND_CLASSIFICATIONS: Record<DependencyBand, { en: string; hi: string; mr: string }> = {
  total: {
    en: 'Total Dependency',
    hi: 'पूर्ण परावलंबन',
    mr: 'पूर्ण परावलंबित्व'
  },
  severe: {
    en: 'Severe Dependency',
    hi: 'गंभीर परावलंबन',
    mr: 'तीव्र परावलंबित्व'
  },
  moderate: {
    en: 'Moderate Dependency',
    hi: 'मध्यम परावलंबन',
    mr: 'मध्यम परावलंबित्व'
  },
  slight: {
    en: 'Slight Dependency',
    hi: 'हल्का परावलंबन',
    mr: 'सौम्य परावलंबित्व'
  },
  independent: {
    en: 'Independent',
    hi: 'स्वतंत्र',
    mr: 'स्वतंत्र'
  }
};

export function getBandClassification(band: DependencyBand) {
  return BAND_CLASSIFICATIONS[band];
}

/**
 * Clamp a response to the set of values the item actually offers.
 * Mirrors the defensive clamping in `calculateZaritScore`.
 */
function clampToItem(item: FunctionItem, raw: number | undefined): number {
  if (raw === undefined || Number.isNaN(raw)) return 0;
  const allowed = item.options.map((o) => o.value);
  if (allowed.includes(raw)) return raw;
  // Snap to the nearest legal option rather than silently accepting a bad value.
  return allowed.reduce((best, v) => (Math.abs(v - raw) < Math.abs(best - raw) ? v : best), allowed[0]);
}

/**
 * Score a functional assessment.
 *
 * @param barthelResponses map of Barthel item id -> selected option value
 * @param lawtonResponses  map of Lawton item id -> 0 or 1
 */
export function calculateFunctionScore(
  barthelResponses: Record<string, number>,
  lawtonResponses: Record<string, number>,
  encounterId?: string
): FunctionEvaluationResult {
  let barthelScore = 0;
  const careIntensityFlags: string[] = [];

  const domainAcc: Record<string, { score: number; max: number }> = {};

  const accumulate = (item: FunctionItem, value: number) => {
    const itemMax = Math.max(...item.options.map((o) => o.value));
    if (!domainAcc[item.domain]) domainAcc[item.domain] = { score: 0, max: 0 };
    domainAcc[item.domain].score += value;
    domainAcc[item.domain].max += itemMax;

    // Flag a care-intensity driver only when capability is fully lost.
    if (item.isCareIntensityDriver && value === 0) {
      careIntensityFlags.push(item.text.en);
    }
  };

  for (const item of BARTHEL_ITEMS) {
    const value = clampToItem(item, barthelResponses[item.id]);
    barthelScore += value;
    accumulate(item, value);
  }

  let lawtonScore = 0;
  for (const item of LAWTON_ITEMS) {
    const value = clampToItem(item, lawtonResponses[item.id]);
    lawtonScore += value;
    accumulate(item, value);
  }

  const band = getBarthelBand(barthelScore);

  const domainBreakdown: FunctionDomainDetail[] = Object.entries(domainAcc).map(
    ([domain, acc]) => ({
      domain: domain as FunctionItem['domain'],
      rawScore: acc.score,
      maxScore: acc.max,
      percentage: acc.max > 0 ? Math.round((acc.score / acc.max) * 100) : 0
    })
  );

  return {
    barthelScore,
    barthelMax: BARTHEL_MAX,
    lawtonScore,
    lawtonMax: LAWTON_MAX,
    dependencyPercentage: BARTHEL_MAX - barthelScore,
    band,
    classification: BAND_CLASSIFICATIONS[band],
    domainBreakdown,
    careIntensityFlags,
    lawtonConvention: 'all-8',
    recordedAt: new Date().toISOString(),
    encounterId
  };
}
