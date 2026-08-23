/**
 * Standardized Zarit Caregiver Burden Scale (ZBI) Clinical Psychometric Engine
 * Supporting ZBI-22 (Full), ZBI-12 (Bédard Short Form), and ZBI-4 (Rapid Triage)
 * Multilingual Support: English (en), Hindi (hi), Marathi (mr)
 */

export type ZbiTier = 'ZBI22' | 'ZBI12' | 'ZBI4';
export type SeverityBand = 'normal' | 'amber' | 'red' | 'critical_red';
export type ZbiFactor = 'personal_strain' | 'role_strain' | 'financial_strain' | 'competency' | 'guilt' | 'global_burden';

export interface ZbiItem {
  id: string;
  number: number;
  factor: ZbiFactor;
  text: {
    en: string;
    hi: string;
    mr: string;
  };
  domainWeights: {
    psychosocial?: number;
    resource?: number;
    physical?: number;
    safety?: number;
    cognitive_behavioral?: number;
    medical?: number;
  };
  isRedFlagTrigger?: boolean;
  redFlagThreshold?: number; // Score >= threshold triggers crisis alert
  redFlagReason?: string;
}

export const LIKERT_OPTIONS = [
  { value: 0, label: { en: 'Never', hi: 'कभी नहीं', mr: 'कधीही नाही' }, description: { en: '0 times', hi: '0 बार', mr: '0 वेळा' } },
  { value: 1, label: { en: 'Rarely', hi: 'कभी-कभार', mr: 'क्वचितच' }, description: { en: 'Seldom', hi: 'दुर्लभ', mr: 'क्वचित' } },
  { value: 2, label: { en: 'Sometimes', hi: 'कभी-कभी', mr: 'कधीकधी' }, description: { en: 'Occasional', hi: 'यदा-कदा', mr: 'काही वेळा' } },
  { value: 3, label: { en: 'Quite Frequently', hi: 'अक्सर', mr: 'वारंवार' }, description: { en: 'Often', hi: 'प्रायः', mr: 'नेहमीसारखे' } },
  { value: 4, label: { en: 'Nearly Always', hi: 'लगभग हमेशा', mr: 'जवळजवळ नेहमी' }, description: { en: 'Constant', hi: 'सतत', mr: 'नेहमीच' } }
];

export const ZBI_22_ITEMS: ZbiItem[] = [
  {
    id: 'zbi_1',
    number: 1,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel that your relative asks for more help than he/she needs?',
      hi: 'क्या आपको लगता है कि आपका परिजन जितनी जरूरत है उससे ज्यादा मदद मांगता है?',
      mr: 'तुम्हाला असे वाटते का की तुमचे नातेवाईक गरजेपेक्षा जास्त मदत मागतात?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_2',
    number: 2,
    factor: 'role_strain',
    text: {
      en: "Do you feel that because of the time you spend with your relative that you don't have enough time for yourself?",
      hi: 'क्या आपको लगता है कि परिजन के साथ समय बिताने के कारण आपके पास अपने लिए पर्याप्त समय नहीं बचता?',
      mr: 'नातेवाईकांसोबत वेळ घालवल्यामुळे तुम्हाला स्वतःसाठी पुरेसा वेळ मिळत नाही असे वाटते का?'
    },
    domainWeights: { resource: 0.6, psychosocial: 0.4 }
  },
  {
    id: 'zbi_3',
    number: 3,
    factor: 'role_strain',
    text: {
      en: 'Do you feel stressed between caring for your relative and trying to meet other responsibilities for your family or work?',
      hi: 'क्या आप परिजन की देखभाल करने और परिवार या काम की अन्य जिम्मेदारियां पूरी करने के बीच तनाव महसूस करते हैं?',
      mr: 'नातेवाईकांची काळजी घेणे आणि कुटुंब किंवा कामाच्या इतर जबाबदाऱ्या सांभाळताना तुम्हाला तणाव जाणवतो का?'
    },
    domainWeights: { resource: 0.5, psychosocial: 0.5 }
  },
  {
    id: 'zbi_4',
    number: 4,
    factor: 'personal_strain',
    text: {
      en: "Do you feel embarrassed over your relative's behavior?",
      hi: 'क्या आपको अपने परिजन के व्यवहार पर शर्मिंदगी महसूस होती है?',
      mr: 'तुम्हाला तुमच्या नातेवाईकांच्या वागण्याची लाज किंवा संकोच वाटतो का?'
    },
    domainWeights: { cognitive_behavioral: 0.6, psychosocial: 0.4 }
  },
  {
    id: 'zbi_5',
    number: 5,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel angry when you are around your relative?',
      hi: 'क्या जब आप अपने परिजन के पास होते हैं तो आपको गुस्सा या चिड़चिड़ाहट महसूस होती है?',
      mr: 'नातेवाईकांजवळ असताना तुम्हाला राग किंवा चीड येते का?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_6',
    number: 6,
    factor: 'role_strain',
    text: {
      en: 'Do you feel that your relative currently affects your relationships with other family members or friends in a negative way?',
      hi: 'क्या आपको लगता है कि आपके परिजन की वजह से परिवार के अन्य सदस्यों या दोस्तों के साथ आपके रिश्तों पर बुरा असर पड़ रहा है?',
      mr: 'नातेवाईकांमुळे कुटुंबातील इतर सदस्यांशी किंवा मित्रांशी असलेल्या संबंधांवर वाईट परिणाम होत आहे असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, resource: 0.3 }
  },
  {
    id: 'zbi_7',
    number: 7,
    factor: 'personal_strain',
    text: {
      en: 'Are you afraid of what the future holds for your relative?',
      hi: 'क्या आप अपने परिजन के भविष्य को लेकर डरे या चिंतित रहते हैं?',
      mr: 'नातेवाईकांच्या भविष्याबद्दल तुम्हाला भीती वाटते का?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_8',
    number: 8,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel your relative is dependent upon you?',
      hi: 'क्या आपको लगता है कि आपका परिजन पूरी तरह आप पर ही निर्भर है?',
      mr: 'तुमचे नातेवाईक पूर्णपणे तुमच्यावर अवलंबून आहेत असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, physical: 0.3 }
  },
  {
    id: 'zbi_9',
    number: 9,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel strained when you are around your relative?',
      hi: 'क्या अपने परिजन के आसपास रहने पर आप खिंचाव या भारीपन महसूस करते हैं?',
      mr: 'नातेवाईकांजवळ असताना तुम्हाला ताण जाणवतो का?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_10',
    number: 10,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel your health has suffered because of your involvement with your relative?',
      hi: 'क्या आपको लगता है कि परिजन की देखभाल में लगे रहने से आपका अपना स्वास्थ्य खराब हुआ है?',
      mr: 'नातेवाईकांची काळजी घेताना तुमचे स्वतःचे आरोग्य खालावले आहे असे वाटते का?'
    },
    domainWeights: { physical: 0.6, psychosocial: 0.4 },
    isRedFlagTrigger: true,
    redFlagThreshold: 3,
    redFlagReason: 'Caregiver Health Deterioration reported at severe level'
  },
  {
    id: 'zbi_11',
    number: 11,
    factor: 'role_strain',
    text: {
      en: "Do you feel that you don't have as much privacy as you would like because of your relative?",
      hi: 'क्या आपको लगता है कि परिजन की वजह से आपको उतनी एकांतता (प्राइवेसी) नहीं मिलती जितनी आप चाहते हैं?',
      mr: 'नातेवाईकांमुळे तुम्हाला हवी तशी वैयक्तिक शांतता आणि एकांत मिळत नाही असे वाटते का?'
    },
    domainWeights: { resource: 0.7, psychosocial: 0.3 }
  },
  {
    id: 'zbi_12',
    number: 12,
    factor: 'role_strain',
    text: {
      en: 'Do you feel that your social life has suffered because you are caring for your relative?',
      hi: 'क्या आपको लगता है कि परिजन की देखभाल करने के कारण आपका सामाजिक जीवन प्रभावित हुआ है?',
      mr: 'नातेवाईकांची काळजी घेतल्यामुळे तुमचे सामाजिक जीवन बाधित झाले आहे असे वाटते का?'
    },
    domainWeights: { resource: 0.8, psychosocial: 0.2 }
  },
  {
    id: 'zbi_13',
    number: 13,
    factor: 'role_strain',
    text: {
      en: 'Do you feel uncomfortable about having friends over because of your relative?',
      hi: 'क्या अपने परिजन की वजह से आपको घर पर दोस्तों या मेहमानों को बुलाने में असहजता महसूस होती है?',
      mr: 'नातेवाईकांमुळे घरी मित्रांना किंवा पाहुण्यांना बोलावण्यास तुम्हाला अवघडल्यासारखे वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, resource: 0.3 }
  },
  {
    id: 'zbi_14',
    number: 14,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel that your relative seems to expect you to take care of him/her as if you were the only one he/she could depend on?',
      hi: 'क्या आपको लगता है कि आपका परिजन आपसे ऐसी उम्मीद करता है मानो दुनिया में सिर्फ आप ही उनकी देखभाल कर सकते हैं?',
      mr: 'नातेवाईकांना वाटते की फक्त तुम्हीच त्यांची काळजी घेऊ शकता, अशी अवास्तव अपेक्षा ते ठेवतात का?'
    },
    domainWeights: { psychosocial: 0.8, resource: 0.2 }
  },
  {
    id: 'zbi_15',
    number: 15,
    factor: 'financial_strain',
    text: {
      en: "Do you feel that you don't have enough money to care for your relative in addition to the rest of your expenses?",
      hi: 'क्या आपको लगता है कि घर के बाकी खर्चों के अलावा परिजन की देखभाल के लिए आपके पास पर्याप्त पैसे नहीं हैं?',
      mr: 'इतर खर्चांव्यतिरिक्त नातेवाईकांच्या काळजीसाठी पुरेसे पैसे नाहीत असे वाटते का?'
    },
    domainWeights: { resource: 1.0 }
  },
  {
    id: 'zbi_16',
    number: 16,
    factor: 'competency',
    text: {
      en: 'Do you feel that you will be unable to take care of your relative much longer?',
      hi: 'क्या आपको लगता है कि आप अब बहुत लंबे समय तक अपने परिजन की देखभाल नहीं कर पाएंगे?',
      mr: 'तुम्हाला वाटते का की तुम्ही यापुढे फार काळ नातेवाईकांची काळजी घेऊ शकणार नाही?'
    },
    domainWeights: { safety: 0.5, psychosocial: 0.5 },
    isRedFlagTrigger: true,
    redFlagThreshold: 3,
    redFlagReason: 'Imminent Caregiver Relinquishment / Breakdown Risk'
  },
  {
    id: 'zbi_17',
    number: 17,
    factor: 'personal_strain',
    text: {
      en: "Do you feel you have lost control of your life since your relative's illness?",
      hi: 'क्या आपको लगता है कि परिजन की बीमारी के बाद से आपने अपने जीवन पर से नियंत्रण खो दिया है?',
      mr: 'नातेवाईकांच्या आजारपणानंतर तुमच्या आयुष्यावरील नियंत्रण सुटले आहे असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.8, resource: 0.2 }
  },
  {
    id: 'zbi_18',
    number: 18,
    factor: 'personal_strain',
    text: {
      en: 'Do you wish you could just leave the care of your relative to someone else?',
      hi: 'क्या आपका मन करता है कि आप परिजन की देखभाल की जिम्मेदारी किसी और को सौंप दें?',
      mr: 'नातेवाईकांची काळजी घेण्याची जबाबदारी इतर कोणावर तरी सोपवावी असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, safety: 0.3 }
  },
  {
    id: 'zbi_19',
    number: 19,
    factor: 'competency',
    text: {
      en: 'Do you feel uncertain about what to do about your relative?',
      hi: 'क्या आप इस बात को लेकर असमंजस में रहते हैं कि अपने परिजन के लिए क्या करना सही है?',
      mr: 'नातेवाईकांसाठी काय करावे याबद्दल तुम्हाला अनिश्चितता वाटते का?'
    },
    domainWeights: { medical: 0.5, cognitive_behavioral: 0.5 }
  },
  {
    id: 'zbi_20',
    number: 20,
    factor: 'guilt',
    text: {
      en: 'Do you feel you should be doing more for your relative?',
      hi: 'क्या आपको लगता है कि आपको अपने परिजन के लिए और अधिक करना चाहिए?',
      mr: 'तुम्हाला असे वाटते का की तुम्ही नातेवाईकांसाठी आणखी जास्त करायला हवे?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_21',
    number: 21,
    factor: 'guilt',
    text: {
      en: 'Do you feel you could do a better job in caring for your relative?',
      hi: 'क्या आपको लगता है कि आप अपने परिजन की देखभाल इससे बेहतर तरीके से कर सकते थे?',
      mr: 'तुम्ही नातेवाईकांची अधिक चांगल्या पद्धतीने काळजी घेऊ शकला असता असे वाटते का?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_22',
    number: 22,
    factor: 'global_burden',
    text: {
      en: 'Overall, how burdened do you feel in caring for your relative?',
      hi: 'कुल मिलाकर, अपने परिजन की देखभाल करने में आप कितना भारी बोझ (बोझिलता) महसूस करते हैं?',
      mr: 'एकंदरीत, नातेवाईकांची काळजी घेताना तुम्हाला किती ताण किंवा ओझे वाटते?'
    },
    domainWeights: { psychosocial: 0.7, physical: 0.3 },
    isRedFlagTrigger: true,
    redFlagThreshold: 3,
    redFlagReason: 'Severe Global Acute Caregiver Overload'
  }
];

export const ZBI_12_ITEM_IDS = ['zbi_1', 'zbi_2', 'zbi_3', 'zbi_7', 'zbi_8', 'zbi_9', 'zbi_11', 'zbi_12', 'zbi_13', 'zbi_14', 'zbi_15', 'zbi_22'];
export const ZBI_4_ITEM_IDS = ['zbi_1', 'zbi_7', 'zbi_8', 'zbi_14'];

export interface FactorDetail {
  title: { en: string; hi: string; mr: string };
  rawScore: number;
  maxScore: number;
  percentage: number;
  clinicalNote: { en: string; hi: string; mr: string };
}

export interface CaregiverPrescription {
  id: string;
  category: 'Respite & Relief' | 'Psychological Support' | 'Skill Training' | 'Resource Assistance';
  title: { en: string; hi: string; mr: string };
  action: { en: string; hi: string; mr: string };
  recommendedLink?: string;
  linkText?: { en: string; hi: string; mr: string };
  urgency: 'routine' | 'priority' | 'urgent';
}

export interface ZaritEvaluationResult {
  tier: ZbiTier;
  totalScore: number;
  maxScore: number;
  normalizedPercentage: number;
  classification: { en: string; hi: string; mr: string };
  severityBand: SeverityBand;
  factors: Record<ZbiFactor, FactorDetail>;
  domainCapacities: {
    psychosocial: number;
    resource: number;
    physical: number;
    safety: number;
    cognitive_behavioral: number;
    medical: number;
  };
  redFlags: string[];
  isCrisisTriggered: boolean;
  prescriptions: CaregiverPrescription[];
  completedAt: string;
}

export function getItemsForTier(tier: ZbiTier): ZbiItem[] {
  if (tier === 'ZBI12') {
    return ZBI_22_ITEMS.filter((item) => ZBI_12_ITEM_IDS.includes(item.id));
  }
  if (tier === 'ZBI4') {
    return ZBI_22_ITEMS.filter((item) => ZBI_4_ITEM_IDS.includes(item.id));
  }
  return ZBI_22_ITEMS;
}

export function calculateZaritScore(
  responses: Record<string, number>,
  tier: ZbiTier
): ZaritEvaluationResult {
  const items = getItemsForTier(tier);
  const maxScore = tier === 'ZBI22' ? 88 : tier === 'ZBI12' ? 48 : 16;
  
  let totalScore = 0;
  const factorAccumulators: Record<ZbiFactor, { score: number; max: number }> = {
    personal_strain: { score: 0, max: 0 },
    role_strain: { score: 0, max: 0 },
    financial_strain: { score: 0, max: 0 },
    competency: { score: 0, max: 0 },
    guilt: { score: 0, max: 0 },
    global_burden: { score: 0, max: 0 }
  };

  const domainLoads: Record<string, number> = {
    psychosocial: 0,
    resource: 0,
    physical: 0,
    safety: 0,
    cognitive_behavioral: 0,
    medical: 0
  };
  const domainWeightsTotal: Record<string, number> = {
    psychosocial: 0,
    resource: 0,
    physical: 0,
    safety: 0,
    cognitive_behavioral: 0,
    medical: 0
  };

  const redFlags: string[] = [];

  for (const item of items) {
    const val = Math.max(0, Math.min(responses[item.id] ?? 0, 4));
    totalScore += val;

    factorAccumulators[item.factor].score += val;
    factorAccumulators[item.factor].max += 4;

    for (const [dom, weight] of Object.entries(item.domainWeights)) {
      if (weight) {
        domainLoads[dom] += (val / 4.0) * 100 * weight;
        domainWeightsTotal[dom] += weight;
      }
    }

    if (item.isRedFlagTrigger && item.redFlagThreshold && val >= item.redFlagThreshold) {
      redFlags.push(`${item.redFlagReason} (Q${item.number}: ${val}/4)`);
    }
  }

  const normalizedPercentage = Math.round((totalScore / maxScore) * 100);

  // Determine Severity and Classification
  let severityBand: SeverityBand = 'normal';
  let classification = {
    en: 'Little to No Burden',
    hi: 'मामूली या न के बराबर तनाव',
    mr: 'फार कमी किंवा नगण्य ताण'
  };

  if (tier === 'ZBI22') {
    if (totalScore <= 20) {
      severityBand = 'normal';
      classification = { en: 'Little to No Burden', hi: 'मामूली या न के बराबर तनाव', mr: 'फार कमी किंवा नगण्य ताण' };
    } else if (totalScore <= 40) {
      severityBand = 'amber';
      classification = { en: 'Mild to Moderate Burden', hi: 'हल्का से मध्यम तनाव', mr: 'मध्यम स्वरूपाचा ताण' };
    } else if (totalScore <= 60) {
      severityBand = 'red';
      classification = { en: 'Moderate to Severe Burden', hi: 'मध्यम से गंभीर तनाव', mr: 'गंभीर स्वरूपाचा ताण' };
    } else {
      severityBand = 'critical_red';
      classification = { en: 'Severe Burden / Burnout', hi: 'अत्यधिक गंभीर बोझ और थकान', mr: 'अति-गंभीर थकवा आणि ताण' };
    }
  } else if (tier === 'ZBI12') {
    if (totalScore < 12) {
      severityBand = 'normal';
      classification = { en: 'Low Burden (Screening Negative)', hi: 'कम तनाव', mr: 'कमी ताण' };
    } else if (totalScore < 17) {
      severityBand = 'amber';
      classification = { en: 'Moderate Burden (Watchlist)', hi: 'मध्यम तनाव', mr: 'मध्यम ताण' };
    } else {
      severityBand = 'red';
      classification = { en: 'High Burden (Burnout Risk Exceeded)', hi: 'उच्च तनाव (बर्नआउट जोखिम)', mr: 'उच्च ताण (थकवा धोका)' };
    }
  } else {
    // ZBI-4
    if (totalScore < 8) {
      severityBand = 'normal';
      classification = { en: 'Screening Negative', hi: 'स्क्रीनिंग सामान्य', mr: 'स्क्रीनिंग सामान्य' };
    } else {
      severityBand = 'red';
      classification = { en: 'Positive for Acute Fatigue (Follow-up needed)', hi: 'तीव्र थकान के संकेत (पूर्ण जांच आवश्यक)', mr: 'तीव्र थकव्याची लक्षणे (तपासणी आवश्यक)' };
    }
  }

  // Factor details
  const factorTitles: Record<ZbiFactor, { en: string; hi: string; mr: string }> = {
    personal_strain: { en: 'Personal Strain & Emotional Load', hi: 'व्यक्तिगत व भावनात्मक दबाव', mr: 'वैयक्तिक व भावनिक ताण' },
    role_strain: { en: 'Role Conflict & Time Restriction', hi: 'समय की कमी और भूमिका संघर्ष', mr: 'वेळेची कमतरता आणि जबाबदाऱ्या' },
    financial_strain: { en: 'Financial Depletion', hi: 'आर्थिक दबाव', mr: 'आर्थिक ताण' },
    competency: { en: 'Care Competence & Control', hi: 'देखभाल क्षमता और नियंत्रण', mr: 'काळजी घेण्याची क्षमता' },
    guilt: { en: 'Guilt & Self-Expectation', hi: 'दोष भावना और अत्यधिक अपेक्षाएं', mr: 'अपराधीपणाची भावना' },
    global_burden: { en: 'Overall Perceived Burden', hi: 'समग्र बोझ का अनुभव', mr: 'एकूण जाणवणारा ताण' }
  };

  const factorNotes: Record<ZbiFactor, { en: string; hi: string; mr: string }> = {
    personal_strain: { en: 'Emotional exhaustion from constant vigilance.', hi: 'निरंतर देखभाल से भावनात्मक थकान।', mr: 'सततच्या देखभालीमुळे भावनिक थकवा.' },
    role_strain: { en: 'Care duties encroaching on personal & family time.', hi: 'व्यक्तिगत जीवन और काम के बीच संतुलन का अभाव।', mr: 'स्वतःच्या जीवनासाठी वेळेचा अभाव.' },
    financial_strain: { en: 'Direct and indirect caregiving expense strain.', hi: 'दवाइयों और देखभाल के अतिरिक्त खर्च का तनाव।', mr: 'औषधोपचार आणि देखभालीचा आर्थिक भार.' },
    competency: { en: 'Anxiety regarding long-term care sustainability.', hi: 'लंबे समय तक सेवा जारी रखने में अनिश्चितता।', mr: 'दीर्घकाळ काळजी घेण्याबाबत साशंकता.' },
    guilt: { en: 'Internal pressure feeling care could be better.', hi: 'खुद पर अत्यधिक दबाव और आत्म-संदेह।', mr: 'स्वतःकडून जास्त अपेक्षा ठेवण्याचा दबाव.' },
    global_burden: { en: 'Global acute weight of day-to-day caregiving.', hi: 'दैनिक दिनचर्या का समग्र मानसिक भार।', mr: 'दैनंदिन देखभालीचा मानसिक भार.' }
  };

  const factors = {} as Record<ZbiFactor, FactorDetail>;
  for (const [key, acc] of Object.entries(factorAccumulators) as [ZbiFactor, { score: number; max: number }][]) {
    const pct = acc.max > 0 ? Math.round((acc.score / acc.max) * 100) : 0;
    factors[key] = {
      title: factorTitles[key],
      rawScore: acc.score,
      maxScore: acc.max,
      percentage: pct,
      clinicalNote: factorNotes[key]
    };
  }

  // Compute CGG Capacities (Capacity = 100 - average load)
  const domainCapacities = {
    psychosocial: 100,
    resource: 100,
    physical: 100,
    safety: 100,
    cognitive_behavioral: 100,
    medical: 100
  };

  for (const dom of Object.keys(domainCapacities) as (keyof typeof domainCapacities)[]) {
    if (domainWeightsTotal[dom] > 0) {
      const avgStrain = domainLoads[dom] / domainWeightsTotal[dom];
      domainCapacities[dom] = Math.round(Math.max(0, Math.min(100, 100 - avgStrain)));
    }
  }

  // Generate Tailored Caregiver Prescriptions
  const prescriptions: CaregiverPrescription[] = [];

  if (factors.role_strain.percentage >= 40 || factors.personal_strain.percentage >= 50) {
    prescriptions.push({
      id: 'rx_respite',
      category: 'Respite & Relief',
      urgency: factors.personal_strain.percentage >= 70 ? 'urgent' : 'priority',
      title: {
        en: 'Schedule 4-Hour Weekly Respite Break',
        hi: 'साप्ताहिक 4 घंटे का विश्राम (रेस्पाइट) तय करें',
        mr: 'आठवड्यातून ४ तासांची विश्रांती निश्चित करा'
      },
      action: {
        en: 'Delegate care duties to a secondary family member or community volunteer once a week for personal rejuvenation.',
        hi: 'हफ्ते में एक बार देखभाल का कार्य किसी अन्य परिजन या स्वयंसेवक को सौंपें ताकि आप स्वयं के लिए समय निकाल सकें।',
        mr: 'स्वतःच्या आरोग्यासाठी आठवड्यातून एकदा देखभालीची जबाबदारी इतर कुटुंबातील सदस्याकडे सोपवा.'
      }
    });
  }

  if (factors.competency.percentage >= 40) {
    prescriptions.push({
      id: 'rx_skills',
      category: 'Skill Training',
      urgency: 'priority',
      title: {
        en: 'Caregiver Bed-Bound & Transfer Techniques',
        hi: 'रोगी को उठाने व स्थिति बदलने की सही तकनीक सीखें',
        mr: 'रुग्णाची हालचाल आणि देखभाल करण्याचे योग्य तंत्र शिका'
      },
      action: {
        en: 'Complete Sanjeevani practical modules to avoid personal physical injury and simplify daily routines.',
        hi: 'संजीवनी के वीडियो मॉड्यूल्स देखकर सही पोस्चर और मरीज को शिफ्ट करने का तरीका सीखें।',
        mr: 'स्वतःला दुखापत टाळण्यासाठी संजीवनी व्हिडिओ मॉड्यूल्स पहा.'
      },
      recommendedLink: '/modules/bed-bound-care',
      linkText: { en: 'Open Bed-Bound Module', hi: 'मॉड्यूल देखें', mr: 'मॉड्यूल उघडा' }
    });
  }

  if (factors.financial_strain.percentage >= 50) {
    prescriptions.push({
      id: 'rx_financial',
      category: 'Resource Assistance',
      urgency: 'priority',
      title: {
        en: 'Access Assistive Aid & Government Subsidies',
        hi: 'सरकारी सहायता व रियायती उपकरण प्राप्त करें',
        mr: 'सरकारी योजना आणि सहाय्यक उपकरणांची मदत घ्या'
      },
      action: {
        en: 'Connect with local ASHA or Medical Social Worker for subsidized diapers, air-mattresses, and Ayushman Bharat benefits.',
        hi: 'सस्ती दवाइयों, व्हीलचेयर और सरकारी योजनाओं की जानकारी हेतु आशा कार्यकर्ता या सामाजिक कार्यकर्ता से संपर्क करें।',
        mr: 'सवलतीच्या दरातील औषधे व उपकरणांसाठी आशा सेविकेशी संपर्क साधा.'
      },
      recommendedLink: '/resources',
      linkText: { en: 'View Welfare Directory', hi: 'सहायता निर्देशिका देखें', mr: 'मार्गदर्शिका पहा' }
    });
  }

  if (severityBand === 'red' || severityBand === 'critical_red' || redFlags.length > 0) {
    prescriptions.push({
      id: 'rx_psych_support',
      category: 'Psychological Support',
      urgency: 'urgent',
      title: {
        en: 'Clinical Tele-Consultation for Caregiver Burnout',
        hi: 'मनोवैज्ञानिक परामर्श व डॉक्टर से टेली-कंसल्टेशन',
        mr: 'मानसोपचारतज्ज्ञांशी टेली-सल्लामसलत'
      },
      action: {
        en: 'Book an expedited consultation with a geriatric counselor to safeguard your emotional health and prevent acute breakdown.',
        hi: 'देखभालकर्ता बर्नआउट से बचाव के लिए संजीवनी टेलीमेडिसिन के जरिए डॉक्टर से तुरंत संपर्क करें।',
        mr: 'तीव्र मानसिक ताणापासून बचावासाठी डॉक्टरांशी तात्काळ संपर्क साधा.'
      },
      recommendedLink: '/appointments',
      linkText: { en: 'Book Consultation', hi: 'परामर्श बुक करें', mr: 'सल्लामसलत बुक करा' }
    });
  }

  return {
    tier,
    totalScore,
    maxScore,
    normalizedPercentage,
    classification,
    severityBand,
    factors,
    domainCapacities,
    redFlags,
    isCrisisTriggered: redFlags.length > 0 || severityBand === 'critical_red',
    prescriptions,
    completedAt: new Date().toISOString()
  };
}
