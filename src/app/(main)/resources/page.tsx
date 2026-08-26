'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ExternalLink,
  Phone,
  ShieldCheck,
  HeartPulse,
  Building2,
  BookOpen,
  Search,
  Printer,
  Sparkles,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Flame,
  Stethoscope,
  Info,
  Layers,
  HeartHandshake,
  Languages
} from 'lucide-react';
import Link from 'next/link';
import {
  patientEducationGuides,
  PatientEducationGuide,
  SupportedLanguage
} from '@/lib/clinical/patient-education-data';
import {
  literatureReviewData,
  LiteratureReviewItem
} from '@/lib/clinical/literature-review-data';

const directoryResources = [
  {
    category: 'National Emergency & Government Portals',
    icon: Building2,
    items: [
      {
        name: 'Elder Line — National Helpline for Senior Citizens (MoSJE & NISD)',
        description: 'Toll-free national helpline offering guidance, emotional support, rescue, and legal aid.',
        url: 'https://elderline.dosje.gov.in',
        phone: '14567'
      },
      {
        name: 'Ministry of Health & Family Welfare — NPHCE Programme',
        description: 'National Programme for the Health Care of Elderly providing geriatric OPDs & regional centers.',
        url: 'https://main.mohfw.gov.in',
        phone: null
      },
      {
        name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        description: 'Government health assurance covering up to ₹5 lakh/year per family, including expanded senior coverage.',
        url: 'https://nha.gov.in/PM-JAY',
        phone: '14555'
      },
      {
        name: 'Tele-MANAS — National Mental Health Helpline',
        description: '24x7 free psychological counseling and mental health triage for caregivers and seniors.',
        url: 'https://telemanas.mohfw.gov.in',
        phone: '14416'
      },
    ],
  },
  {
    category: 'Geriatric Professional & Clinical Societies',
    icon: HeartPulse,
    items: [
      {
        name: 'Geriatric Society of India (GSI)',
        description: 'Pioneering organization dedicated to geriatric clinical research and physician education.',
        url: 'https://geriatricindia.com',
        phone: null
      },
      {
        name: 'Indian Academy of Geriatrics (IAG)',
        description: 'National association advancing clinical gerontology, standards of practice, and education.',
        url: 'https://iagindia.in',
        phone: null
      },
      {
        name: 'National Institute of Social Defence (NISD)',
        description: 'Nodal training institute for caregiving, dementia sensitization, and old age care management.',
        url: 'https://nisd.gov.in',
        phone: null
      },
    ],
  },
  {
    category: 'Caregiver Support & Elder Welfare NGOs',
    icon: ShieldCheck,
    items: [
      {
        name: 'HelpAge India',
        description: 'Leading national NGO running mobile healthcare units, caregiver training, and elder rights advocacy.',
        url: 'https://www.helpageindia.org',
        phone: '1800-180-1253'
      },
      {
        name: 'Agewell Foundation',
        description: 'Grassroots foundation working for elder empowerment, social engagement, and caregiver support.',
        url: 'https://www.agewellfoundation.org',
        phone: '011-29836486'
      },
      {
        name: 'Pallium India — Palliative Care & Relief Network',
        description: 'Dedicated to pain management, home-based palliative care, and caregiver respite counseling.',
        url: 'https://palliumindia.org',
        phone: '1800-572-8880'
      },
    ],
  },
  {
    category: 'Condition-Specific Care Networks',
    icon: BookOpen,
    items: [
      {
        name: 'Alzheimer’s & Related Disorders Society of India (ARDSI)',
        description: 'Comprehensive dementia caregiver counseling, day-care centers, and home-care training.',
        url: 'https://www.ardsi.org',
        phone: '0484-2808299'
      },
      {
        name: 'Parkinson’s Disease & Movement Disorder Society (PDMDS)',
        description: 'Rehabilitation therapy, support groups, and multidisciplinary care across India.',
        url: 'https://www.parkinsonssocietyindia.com',
        phone: '022-24147040'
      },
      {
        name: 'Indian Council of Medical Research (ICMR) — Geriatric Guidelines',
        description: 'Evidence-based protocols and consensus clinical guidelines for elderly care.',
        url: 'https://www.icmr.nic.in',
        phone: null
      },
    ],
  },
];

const emergencyProtocolsByLang = {
  en: [
    {
      id: 'chest-pain',
      title: 'Acute Chest Pain / Heart Attack',
      triggers: 'Heavy pressure or squeezing in chest, pain in left arm or jaw, shortness of breath, cold sweat.',
      immediateActions: [
        'Have the person immediately sit or rest semi-reclined. Never allow them to walk or climb stairs.',
        'If prescribed Sorbitrate/Nitroglycerin is available, give 1 tablet under the tongue (if upper BP > 100).',
        'Call 108 Emergency immediately. Loosen tight shirt collars and stay calm.'
      ],
      whatNotToDo: 'Do not give heavy meals, water, or leave the person alone.'
    },
    {
      id: 'stroke-fast',
      title: 'Suspected Stroke (FAST Signs)',
      triggers: 'Face drooping on one side, Arm weakness (cannot raise arm), Slurred or lost speech.',
      immediateActions: [
        'F - Face: Check if one side of smile droops.',
        'A - Arms: Check if one arm drifts down when raised.',
        'S - Speech: Ask them to repeat a simple sentence.',
        'T - Time: Note the EXACT minute symptoms started and call 108 immediately for urgent hospital care.'
      ],
      whatNotToDo: 'Do not give aspirin, water, or food until swallowing is checked at the hospital.'
    },
    {
      id: 'sudden-delirium',
      title: 'Sudden Severe Confusion / Delirium',
      triggers: 'Sudden hallucinations, seeing imaginary things, or extreme sleepiness developing over a few hours.',
      immediateActions: [
        'Check blood sugar immediately with glucometer (rule out low sugar < 70 mg/dL).',
        'Check oxygen on pulse oximeter (if SpO2 < 92%, seek urgent doctor support).',
        'Check for bad-smelling urine, fever, or constipation for 3+ days.'
      ],
      whatNotToDo: 'Do not forcefully tie down or give unprescribed sleeping pills.'
    },
    {
      id: 'severe-hypoglycemia',
      title: 'Severe Low Blood Sugar Collapse',
      triggers: 'Blood sugar < 50 mg/dL, person passed out, seizures, unable to swallow.',
      immediateActions: [
        'Do NOT pour liquid or water into the mouth of an unconscious person (danger of choking).',
        'Turn the person onto their side in recovery position to keep airway clear.',
        'Call 108 immediately for urgent IV glucose.'
      ],
      whatNotToDo: 'Never force sugar water into an unconscious person.'
    },
    {
      id: 'fall-fracture',
      title: 'Fall with Broken Bone (Fracture)',
      triggers: 'Elder unable to get up or put weight on leg, leg looks rotated outward or shortened, severe hip pain.',
      immediateActions: [
        'Keep the person warm and still on the floor; do NOT violently yank them onto their feet.',
        'Support the injured leg with soft pillows or folded blankets.',
        'Call 108 emergency transport for safe stretcher transfer.'
      ],
      whatNotToDo: 'Do not force the patient to stand or try to straighten deformed joints.'
    }
  ],
  hi: [
    {
      id: 'chest-pain',
      title: 'सीने में तेज दर्द / हार्ट अटैक का खतरा',
      triggers: 'सीने में भारीपन, बाएं हाथ या जबड़े तक जाने वाला दर्द, सांस फूलना, ठंडा पसीना छूटना।',
      immediateActions: [
        'मरीज को तुरंत आरामदायक स्थिति में बैठाएं या आधा लिटाएं। उन्हें पैदल न चलने दें।',
        'अगर डॉक्टर की दी हुई सोर्बिट्रेट गोली पास है, तो जीभ के नीचे रखें (अगर बीपी 100 से ऊपर हो)।',
        'तुरंत 108 इमरजेंसी एम्बुलेंस को फोन करें। गले और कमर के कपड़े ढीले करें।'
      ],
      whatNotToDo: 'मरीज को अकेले न छोड़ें और कुछ भी भारी खाने-पीने को न दें।'
    },
    {
      id: 'stroke-fast',
      title: 'लकवे (स्ट्रोक) का खतरा — FAST नियम',
      triggers: 'चेहरा एक तरफ टेढ़ा होना, एक हाथ उठाने में असमर्थ होना, आवाज लड़खड़ाना या बंद होना।',
      immediateActions: [
        'F (Face): मुस्कुराने को कहें—क्या चेहरा एक तरफ लटक रहा है?',
        'A (Arms): दोनों हाथ उठाने को कहें—क्या एक हाथ नीचे गिर रहा है?',
        'S (Speech): एक आसान वाक्य बोलने को कहें—क्या आवाज लड़खड़ा रही है?',
        'T (Time): लक्षण शुरू होने का ठीक समय नोट करें और तुरंत 108 पर फोन करें।'
      ],
      whatNotToDo: 'अस्पताल पहुंचने तक मरीज को पानी, खाना या एस्पिरिन गोली न दें।'
    },
    {
      id: 'sudden-delirium',
      title: 'अचानक दिमागी भ्रम / डेलिरियम',
      triggers: 'कुछ ही घंटों में अचानक बहकी-बहकी बातें करना, डरना या बहुत ज्यादा बेहोश जैसी सुस्ती छाना।',
      immediateActions: [
        'ग्लूकोमीटर से तुरंत शुगर नापें (देखें कि शुगर 70 से कम तो नहीं)।',
        'पल्स ऑक्सीमीटर से ऑक्सीजन नापें (अगर 92% से कम है तो तुरंत डॉक्टर को दिखाएं)।',
        'पेशाब में बदबू, बुखार या 3 दिन से पेट साफ न होने की जांच करें।'
      ],
      whatNotToDo: 'घबराए मरीज को जबरन न बांधें और बिना डॉक्टर के नींद की गोली न दें।'
    },
    {
      id: 'severe-hypoglycemia',
      title: 'शुगर का बहुत ज्यादा गिर जाना (बेहोशी)',
      triggers: 'शुगर 50 से कम होना, मरीज का बेहोश हो जाना या निगल न पाना।',
      immediateActions: [
        'बेहोश मरीज के मुंह में पानी, चीनी या शरबत कभी न डालें (फेफड़े में जाने का खतरा)।',
        'मरीज को एक करवट पर लिटाएं ताकि सांस की नली खुली रहे।',
        'तुरंत 108 पर एम्बुलेंस बुलाएं ताकि ग्लूकोज की ड्रिप चढ़ाई जा सके।'
      ],
      whatNotToDo: 'बेहोश मरीज के मुंह में जबरन पानी न डालें।'
    },
    {
      id: 'fall-fracture',
      title: 'गिरने पर हड्डी टूटना (फ्रैक्चर)',
      triggers: 'गिरने के बाद पैर पर वजन न दे पाना, पैर का बाहर मुड़ा दिखना, कूल्हे में तेज दर्द।',
      immediateActions: [
        'मरीज को फर्श पर ही शांत और सीधा रहने दें; जबरन खींचकर खड़ा न करें।',
        'चोट लगे पैर के दोनों तरफ तकिए या कंबल का सहारा लगाएं।',
        'स्ट्रेचर से सुरक्षित ले जाने के लिए 108 पर फोन करें।'
      ],
      whatNotToDo: 'मुड़े हुए पैर को सीधा करने की कोशिश न करें और मरीज को न चलाएं।'
    }
  ],
  mr: [
    {
      id: 'chest-pain',
      title: 'छातीत तीव्र वेदना / हृदयविकाराचा झटका',
      triggers: 'छातीत जडपणा, डाव्या हातात किंवा जबड्यात दुखणे, धाप लागणे, गार घाम फुटणे.',
      immediateActions: [
        'रुग्णाला लगेच टेकून शांत बसवा. त्यांना चालवू नका किंवा जिन्यावरून नेऊ नका.',
        'डॉक्टरांनी दिलेली सॉर्बिट्रेट गोळी असल्यास जिभेखाली ठेवा (जर वरचा बीपी १०० पेक्षा जास्त असेल).',
        'तातडीने १०८ रुग्णवाहिकेला फोन करा. कपडे सैल करा आणि शांत राहा.'
      ],
      whatNotToDo: 'रुग्णाला एकटे सोडू नका आणि पाणी किंवा अन्न देऊ नका.'
    },
    {
      id: 'stroke-fast',
      title: 'पक्षाघाताची (स्ट्रोक) शक्यता — FAST पद्धत',
      triggers: 'चेहरा एका बाजूला वाकडा होणे, एका हातात ताकद न राहणे, बोलताना जीभ अडखळणे.',
      immediateActions: [
        'F (Face): हसायला सांगा—चेहरा एका बाजूला कलंडतो का पहा.',
        'A (Arms): दोन्ही हात वर करायला सांगा—एक हात खाली पडतो का पहा.',
        'S (Speech): साधे वाक्य बोलायला सांगा—जीभ जड होते का पहा.',
        'T (Time): लक्षणे सुरू झालेली अचूक वेळ लक्षात ठेवा आणि लगेच १०८ वर फोन करा.'
      ],
      whatNotToDo: 'दवाखान्यात पोहोचेपर्यंत रुग्णाला पाणी किंवा कोणतीही गोळी देऊ नका.'
    },
    {
      id: 'sudden-delirium',
      title: 'अचानक गोंधळणे / डेलिरियम',
      triggers: 'काही तासांत अचानक बहकल्यासारखे बोलणे, अस्तित्वात नसलेल्या गोष्टी दिसणे किंवा अतिशय गुंगी येणे.',
      immediateActions: [
        'ग्लुकोमीटरने लगेच साखर तपासा (साखर ७० पेक्षा कमी नाही ना ते पहा).',
        'पल्स ऑक्सिमीटरने ऑक्सिजन तपासा (९२% पेक्षा कमी असल्यास लगेच वैद्यकीय मदत घ्या).',
        'लघवीतील इन्फेक्शन, ताप किंवा ३ दिवस पोट साफ न झाल्याची खात्री करा.'
      ],
      whatNotToDo: 'रुग्णाला बांधून ठेवू नका आणि डॉक्टरांना विचारल्याशिवाय झोपेचे औषध देऊ नका.'
    },
    {
      id: 'severe-hypoglycemia',
      title: 'साखर खूप कमी होऊन बेशुद्ध पडणे',
      triggers: 'साखर ५० पेक्षा कमी होणे, रुग्ण बेशुद्ध पडणे किंवा गिळता न येणे.',
      immediateActions: [
        'बेशुद्ध व्यक्तीच्या तोंडात पाणी किंवा साखरेचे पाणी कधीही घालू नका (श्वासनलिकेत जाण्याचा धोका).',
        'रुग्णाला एका कुशीवर झोपवा जेणेकरून श्वास नीट घेता येईल.',
        'ग्लुकोज सलाईन लावण्यासाठी तातडीने १०८ वर फोन करा.'
      ],
      whatNotToDo: 'बेशुद्ध रुग्णाच्या तोंडात बळजबरीने पाणी घालू नका.'
    },
    {
      id: 'fall-fracture',
      title: 'पडल्यामुळे हाड मोडणे (फ्रॅक्चर)',
      triggers: 'पडल्यानंतर पायावर उभे राहता न येणे, पाय वाकडा किंवा लहान दिसणे, खुब्यात असह्य वेदना.',
      immediateActions: [
        'रुग्णाला जमिनीवरच शांत राहू द्या; बळजबरीने उठवण्याचा प्रयत्न करू नका.',
        'दुखावलेल्या पायाखाली उशी किंवा घडी घातलेली चादर ठेवून आधार द्या.',
        'सुरक्षित नेण्यासाठी १०८ रुग्णवाहिकेला फोन करा.'
      ],
      whatNotToDo: 'पाय ओढून सरळ करण्याचा किंवा रुग्णाला चालवण्याचा प्रयत्न करू नका.'
    }
  ]
};

const uiText = {
  en: {
    heroTag: 'Easy Patient Education',
    guidelineTag: 'WHO & ICMR Aligned',
    beersTag: 'Safe Medication Guide',
    heroTitle: 'Patient & Family Education Hub',
    heroSubtitle: 'Simple, practical health guides written in easy language for families, elders, and home caregivers.',
    searchPlaceholder: 'Search by topic (e.g. Blood Pressure, Sugar, Falls, Memory, Bedsores, Medicines)...',
    clearSearch: 'Clear Search',
    tabLeaflets: 'Patient Handouts',
    tabLiterature: 'Clinical Literature Matrix',
    tabEmergency: 'Emergency Actions (108)',
    tabDirectory: 'National Helplines',
    filterAll: 'All Topics',
    minRead: 'min read',
    keyHighlights: 'Key Action Points',
    redFlagAlert: 'Danger Warning:',
    printBtn: 'Print Handout',
    fullGuideBtn: 'Read Guide',
    whyItMattersHeader: 'Why This Matters in Plain Words',
    actionStepsHeader: 'What You Should Do Every Day',
    recommendedFoodHeader: 'Recommended Food & Lifestyle',
    avoidHeader: 'What to Avoid',
    medicationHeader: 'Medicine Safety Tips',
    redFlagHeader: 'Danger Signs (Call 108 or Doctor Immediately)',
    checklistHeader: 'Daily Caregiver Checklist',
    evidenceNote: 'Clinical Standard:'
  },
  hi: {
    heroTag: 'आसान भाषा में मरीज शिक्षा',
    guidelineTag: 'WHO और ICMR प्रमाणित',
    beersTag: 'सुरक्षित दवाई गाइड',
    heroTitle: 'मरीज एवं परिवार स्वास्थ्य शिक्षा केंद्र',
    heroSubtitle: 'बुजुर्गों और परिवार के देखभालकर्ताओं के लिए सरल और आसान भाषा में तैयार की गई स्वास्थ्य जानकारियां।',
    searchPlaceholder: 'बीमारी या विषय खोजें (जैसे बीपी, शुगर, गिरना, भूलने की बीमारी, बेडसोर, दवाई)...',
    clearSearch: 'सर्च हटाएं',
    tabLeaflets: 'मरीज शिक्षा पत्रक',
    tabLiterature: 'चिकित्सीय साहित्य',
    tabEmergency: 'आपातकालीन कदम (108)',
    tabDirectory: 'राष्ट्रीय हेल्पलाइन',
    filterAll: 'सभी विषय',
    minRead: 'मिनट',
    keyHighlights: 'मुख्य जरूरी बातें',
    redFlagAlert: 'खतरे की चेतावनी:',
    printBtn: 'प्रिंट निकालें',
    fullGuideBtn: 'पूरी जानकारी पढ़ें',
    whyItMattersHeader: 'यह बात क्यों जरूरी है (आसान शब्दों में)',
    actionStepsHeader: 'रोजाना करने वाले जरूरी काम',
    recommendedFoodHeader: 'खान-पान की सही सलाह',
    avoidHeader: 'इनसे परहेज करें',
    medicationHeader: 'दवाइयों की सुरक्षा के नियम',
    redFlagHeader: 'खतरे के लक्षण (तुरंत डॉक्टर या 108 पर फोन करें)',
    checklistHeader: 'रोजाना की चेकलिस्ट',
    evidenceNote: 'चिकित्सीय आधार:'
  },
  mr: {
    heroTag: 'सोप्या भाषेतील रुग्ण शिक्षण',
    guidelineTag: 'WHO आणि ICMR मार्गदर्शक',
    beersTag: 'औषध सुरक्षा मार्गदर्शक',
    heroTitle: 'रुग्ण आणि कुटुंब आरोग्य शिक्षण केंद्र',
    heroSubtitle: 'ज्येष्ठ नागरिक आणि त्यांच्या कुटुंबीयांसाठी समजायला अत्यंत सोप्या भाषेतील आरोग्य मार्गदर्शक.',
    searchPlaceholder: 'विषय शोधा (उदा. बीपी, साखर, पडणे, विस्मरण, बेड्सोर, औषधे)...',
    clearSearch: 'शोध हटवा',
    tabLeaflets: 'रुग्ण माहिती पत्रक',
    tabLiterature: 'वैद्यकीय साहित्य',
    tabEmergency: 'तातडीची मदत (१०८)',
    tabDirectory: 'राष्ट्रीय हेल्पलाइन',
    filterAll: 'सर्व विषय',
    minRead: 'मिनिटे',
    keyHighlights: 'महत्त्वाच्या कृती',
    redFlagAlert: 'धोक्याचा इशारा:',
    printBtn: 'प्रिंट काढा',
    fullGuideBtn: 'सविस्तर वाचा',
    whyItMattersHeader: 'हे का महत्त्वाचे आहे (सोप्या शब्दांत)',
    actionStepsHeader: 'दररोज करावयाची सोपी काळजी',
    recommendedFoodHeader: 'योग्य आहार आणि दिनचर्या',
    avoidHeader: 'हे टाळावे',
    medicationHeader: 'औषध सुरक्षेचे नियम',
    redFlagHeader: 'धोक्याची लक्षणे (लगेच डॉक्टर किंवा १०८ वर फोन करा)',
    checklistHeader: 'दररोजची तपासणी यादी (चेकलिस्ट)',
    evidenceNote: 'वैद्यकीय संदर्भ:'
  }
};

export default function ResourcesPage() {
  const globalLocale = useLocale();
  // Default to English as requested, but respect hi or mr if active or selected
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedGuideForPrint, setSelectedGuideForPrint] = useState<{
    guide: PatientEducationGuide;
    lang: SupportedLanguage;
  } | null>(null);

  // Sync initial language with next-intl if it's hi or mr, else en default
  useEffect(() => {
    if (globalLocale === 'hi' || globalLocale === 'mr') {
      setCurrentLang(globalLocale);
    } else {
      setCurrentLang('en');
    }
  }, [globalLocale]);

  const t = uiText[currentLang];
  const activeEmergencyProtocols = emergencyProtocolsByLang[currentLang];

  // Filter education guides based on search query and category
  const filteredEducationGuides = patientEducationGuides.filter((guide) => {
    const langContent = guide[currentLang];
    const matchesSearch =
      langContent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      langContent.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      langContent.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || guide.category.toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Filter literature reviews
  const filteredLiterature = literatureReviewData.filter((item) => {
    return (
      item.guideline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyFindings.some((kf) => kf.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePrint = (guide: PatientEducationGuide) => {
    setSelectedGuideForPrint({ guide, lang: currentLang });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Top Banner with In-Page Language Switcher Toggle */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-background to-secondary/30 border border-primary/20 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
                {t.heroTag}
              </Badge>
              <Badge variant="outline" className="border-primary/40 text-primary text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {t.guidelineTag}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {t.beersTag}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-headline flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary shrink-0" />
              {t.heroTitle}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>

          {/* Prominent Language Switcher Bar */}
          <div className="p-2 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-1.5 shrink-0 self-start">
            <span className="text-[11px] font-bold text-muted-foreground px-2 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-primary" /> Select Language / भाषा निवडा:
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={currentLang === 'en' ? 'default' : 'outline'}
                onClick={() => setCurrentLang('en')}
                className="h-8 text-xs font-bold rounded-xl px-3"
              >
                English (Default)
              </Button>
              <Button
                size="sm"
                variant={currentLang === 'hi' ? 'default' : 'outline'}
                onClick={() => setCurrentLang('hi')}
                className="h-8 text-xs font-bold rounded-xl px-3"
              >
                हिंदी (Hindi)
              </Button>
              <Button
                size="sm"
                variant={currentLang === 'mr' ? 'default' : 'outline'}
                onClick={() => setCurrentLang('mr')}
                className="h-8 text-xs font-bold rounded-xl px-3"
              >
                मराठी (Marathi)
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background/90 border-border/80 rounded-xl text-sm"
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs text-muted-foreground shrink-0"
            >
              {t.clearSearch}
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="education" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1.5 bg-muted/60 rounded-2xl gap-1">
          <TabsTrigger value="education" className="rounded-xl py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>{t.tabLeaflets}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
              {patientEducationGuides.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="emergency" className="rounded-xl py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>{t.tabEmergency}</span>
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
              5
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="literature" className="rounded-xl py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>{t.tabLiterature}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
              {literatureReviewData.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="directory" className="rounded-xl py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>{t.tabDirectory}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PATIENT & CAREGIVER EDUCATION LEAFLETS */}
        <TabsContent value="education" className="space-y-6">
          {/* Quick Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-semibold text-muted-foreground shrink-0">Topic:</span>
            {['all', 'Cardiovascular', 'Diabetes', 'Falls', 'Cognitive', 'Medication', 'Bedside', 'Nutrition', 'Delirium'].map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="rounded-full text-xs h-7 px-3 shrink-0"
              >
                {cat === 'all' ? t.filterAll : cat}
              </Button>
            ))}
          </div>

          {/* Education Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEducationGuides.map((guide) => {
              const lang = guide[currentLang];
              return (
                <Card key={guide.id} className="rounded-2xl border-border/80 shadow-sm flex flex-col hover:border-primary/40 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary">
                        {guide.category}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{guide.readingTimeMinutes} {t.minRead}</span>
                      </div>
                    </div>
                    <CardTitle className="font-headline text-lg sm:text-xl text-foreground">
                      {lang.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                      {lang.subtitle}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-grow text-xs leading-relaxed text-foreground/90">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                      <p className="font-medium">{lang.overview}</p>
                    </div>

                    {/* Highlights Summary */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {t.keyHighlights}
                      </h5>
                      <ul className="space-y-1 pl-1">
                        {lang.actionableSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-primary font-bold">•</span>
                            <span><strong>{step.title}:</strong> {step.tips[0]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Red Flag Warning Snippet */}
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{t.redFlagAlert}</span>
                      </div>
                      <p className="text-[11px] line-clamp-1">{lang.redFlagEmergencySigns[0]}</p>
                    </div>
                  </CardContent>

                  {/* Footer with Dialog Modal Details & Print Option */}
                  <div className="p-4 pt-0 border-t border-border/40 mt-auto flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground italic truncate max-w-[180px]">
                      {lang.evidenceSource}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(guide)}
                        className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" /> {t.printBtn}
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="h-8 text-xs font-bold bg-primary text-primary-foreground">
                            {t.fullGuideBtn} <BookOpen className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
                          <DialogHeader className="space-y-2 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-primary text-primary-foreground">{guide.category}</Badge>
                              <Badge variant="outline" className="text-muted-foreground">{guide.readingTimeMinutes} {t.minRead}</Badge>
                            </div>
                            <DialogTitle className="font-headline text-2xl sm:text-3xl">{lang.title}</DialogTitle>
                            <DialogDescription className="text-sm">{lang.subtitle}</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6 mt-4 text-sm text-foreground">
                            {/* Overview & Clinical Importance */}
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 space-y-2">
                              <h4 className="font-bold font-headline text-primary text-base flex items-center gap-2">
                                <Info className="w-4 h-4" /> {t.whyItMattersHeader}
                              </h4>
                              <p className="text-xs leading-relaxed text-foreground/90">{lang.overview}</p>
                              <p className="text-xs font-semibold text-foreground/90 pt-1">💡 {lang.whyItMatters}</p>
                            </div>

                            {/* Actionable Steps */}
                            <div className="space-y-4">
                              <h4 className="font-bold font-headline text-base text-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {t.actionStepsHeader}
                              </h4>
                              <div className="space-y-3">
                                {lang.actionableSteps.map((step, sIdx) => (
                                  <div key={sIdx} className="p-4 rounded-2xl bg-card border border-border/80 space-y-2">
                                    <h5 className="font-bold text-sm text-foreground">{step.title}</h5>
                                    <p className="text-xs text-muted-foreground">{step.description}</p>
                                    <ul className="space-y-1.5 pl-2 text-xs">
                                      {step.tips.map((tip, tIdx) => (
                                        <li key={tIdx} className="flex items-start gap-2">
                                          <span className="text-primary font-bold">✓</span>
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Diet & Indian Lifestyle Adaptations */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                  {t.recommendedFoodHeader}
                                </h5>
                                <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-100">
                                  {lang.dietaryAndLifestyle.recommendations.map((rec, rIdx) => (
                                    <li key={rIdx} className="flex items-start gap-1.5">
                                      <span>•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                                <h5 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                  {t.avoidHeader}
                                </h5>
                                <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-100">
                                  {lang.dietaryAndLifestyle.whatToAvoid.map((avoid, aIdx) => (
                                    <li key={aIdx} className="flex items-start gap-1.5">
                                      <span>✕</span>
                                      <span>{avoid}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Medication Pearls & Beers List */}
                            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                              <h5 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                <HeartPulse className="w-4 h-4" /> {t.medicationHeader}
                              </h5>
                              <ul className="space-y-1.5 text-xs text-blue-950 dark:text-blue-100">
                                {lang.medicationPearls.map((pearl, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-1.5">
                                    <span>💊</span>
                                    <span>{pearl}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Red Flag Emergency Symptoms */}
                            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 space-y-2">
                              <h5 className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                {t.redFlagHeader}
                              </h5>
                              <ul className="space-y-1.5 text-xs text-rose-950 dark:text-rose-100 font-medium">
                                {lang.redFlagEmergencySigns.map((sign, sIdx) => (
                                  <li key={sIdx} className="flex items-start gap-1.5">
                                    <span>🚨</span>
                                    <span>{sign}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Daily Caregiver Checklist */}
                            <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-2">
                              <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-primary" /> {t.checklistHeader}
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {lang.dailyChecklist.map((chk, cIdx) => (
                                  <div key={cIdx} className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border/50">
                                    <input type="checkbox" className="rounded text-primary focus:ring-primary h-3.5 w-3.5" />
                                    <span>{chk}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Print Action in Modal */}
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                              <span className="text-xs text-muted-foreground">
                                {t.evidenceNote} {lang.evidenceSource}
                              </span>
                              <Button onClick={() => handlePrint(guide)} className="font-bold text-xs flex items-center gap-1.5">
                                <Printer className="w-4 h-4" /> {t.printBtn}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: EMERGENCY RED-FLAG PROTOCOLS */}
        <TabsContent value="emergency" className="space-y-6">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-rose-700 dark:text-rose-300">
                {currentLang === 'hi'
                  ? 'तत्काल आपातकालीन कदम (108 एम्बुलेंस)'
                  : currentLang === 'mr'
                  ? 'तातडीची वैद्यकीय आणीबाणी (१०८ रुग्णवाहिका)'
                  : 'Immediate Crisis & Emergency Action Protocols'}
              </h3>
              <p className="text-xs text-rose-800/80 dark:text-rose-200/80">
                {currentLang === 'hi'
                  ? 'किसी भी गंभीर लक्षण में तुरंत 108 नंबर पर फोन करें या नजदीकी अस्पताल पहुंचें।'
                  : currentLang === 'mr'
                  ? 'कोणत्याही गंभीर लक्षणात तातडीने १०८ नंबरवर फोन करा किंवा जवळच्या रुग्णालयात जा.'
                  : 'In all acute emergencies, call 108 (National Emergency Ambulance) or your nearest hospital immediately.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeEmergencyProtocols.map((protocol) => (
              <Card key={protocol.id} className="rounded-2xl border-rose-500/20 shadow-sm bg-card hover:border-rose-500/40 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-headline text-lg text-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500" />
                      {protocol.title}
                    </CardTitle>
                    <Badge variant="destructive" className="text-[10px]">
                      {currentLang === 'hi' ? 'इमरजेंसी' : currentLang === 'mr' ? 'आणीबाणी' : 'Emergency'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground pt-1">
                    <strong>
                      {currentLang === 'hi' ? 'खतरे के लक्षण:' : currentLang === 'mr' ? 'धोक्याची लक्षणे:' : 'Warning Triggers:'}
                    </strong>{' '}
                    {protocol.triggers}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-1.5">
                    <h5 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      {currentLang === 'hi'
                        ? 'तुरंत करने वाले कदम:'
                        : currentLang === 'mr'
                        ? 'तातडीने करावयाची कृती:'
                        : 'Immediate Action Steps:'}
                    </h5>
                    <ul className="space-y-1 pl-1">
                      {protocol.immediateActions.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-bold text-rose-500">{idx + 1}.</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    <strong>
                      {currentLang === 'hi' ? '❌ क्या न करें:' : currentLang === 'mr' ? '❌ काय करू नये:' : '❌ What NOT to do:'}
                    </strong>{' '}
                    {protocol.whatNotToDo}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: EVIDENCE-BASED LITERATURE REVIEW MATRIX */}
        <TabsContent value="literature" className="space-y-6">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Geriatric Systematic Evidence Base & Guideline Matrix
            </h3>
            <p className="text-xs text-muted-foreground">
              Synthesizing gold-standard clinical consensus from the World Health Organization (WHO), American Geriatrics Society (AGS), Indian Council of Medical Research (ICMR), and NICE.
            </p>
          </div>

          <div className="space-y-4">
            {filteredLiterature.map((item) => (
              <Card key={item.id} className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
                <CardHeader className="bg-card pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-xs font-semibold border-primary/40 text-primary">
                      {item.category}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] font-mono">
                      {item.evidenceLevel}
                    </Badge>
                  </div>
                  <CardTitle className="font-headline text-xl text-foreground">
                    {item.guideline}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{item.organization}</span>
                    <span>•</span>
                    <span>Published/Updated: {item.year}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs leading-relaxed pt-2">
                  {/* Key Findings */}
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Key Systematic Findings
                    </h5>
                    <ul className="space-y-1.5 pl-2">
                      {item.keyFindings.map((kf, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary font-bold">▶</span>
                          <span className="text-foreground/90">{kf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Caregiver Implications & Clinical Recommendations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5">
                      <h5 className="font-bold text-xs text-primary flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5" /> Implications for Family Caregivers
                      </h5>
                      <ul className="space-y-1 pl-1 text-[11px] text-foreground/80">
                        {item.caregiverImplications.map((ci, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span>•</span>
                            <span>{ci}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 space-y-1.5">
                      <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-primary" /> Clinical Practice Recommendations
                      </h5>
                      <ul className="space-y-1 pl-1 text-[11px] text-muted-foreground">
                        {item.clinicalRecommendations.map((cr, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span>•</span>
                            <span>{cr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Reference Citation & Link */}
                  <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <span className="text-muted-foreground italic truncate max-w-xl">
                      Citation: {item.doiOrCitation}
                    </span>
                    <Link
                      href={item.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline shrink-0"
                    >
                      <span>View Official Literature</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: NATIONAL DIRECTORY & GOVERNMENT HELPLINES */}
        <TabsContent value="directory" className="space-y-6">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              National Geriatric Welfare, Helplines & NGO Directory
            </h3>
            <p className="text-xs text-muted-foreground">
              Official Indian government eldercare welfare portals, clinical associations, and 24x7 toll-free crisis response numbers.
            </p>
          </div>

          <Accordion type="single" collapsible defaultValue="National Emergency & Government Portals" className="w-full space-y-3">
            {directoryResources.map((resource) => (
              <AccordionItem
                key={resource.category}
                value={resource.category}
                className="border border-border/80 rounded-2xl bg-card/60 px-5 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="text-base sm:text-lg font-bold hover:no-underline py-4">
                  <span className="flex items-center gap-2.5">
                    <resource.icon className="w-5 h-5 text-primary" />
                    {resource.category}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-3 pt-1">
                    {resource.items.map((item) => (
                      <li
                        key={item.name}
                        className="p-3.5 rounded-xl bg-background border border-border/60 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{item.name}</span>
                            {item.phone && (
                              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                                <Phone className="w-2.5 h-2.5 mr-1 inline" /> {item.phone}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.phone && (
                            <a href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}>
                              <Badge className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 cursor-pointer text-xs py-1 px-2.5">
                                Call
                              </Badge>
                            </a>
                          )}
                          <Link
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/5"
                          >
                            <span>Visit Portal</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>

      {/* Hidden Print Template for Clean Handout Export */}
      {selectedGuideForPrint && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[99999]">
          {(() => {
            const printLang = selectedGuideForPrint.guide[selectedGuideForPrint.lang];
            return (
              <>
                <div className="border-b-2 border-black pb-4 mb-4">
                  <h1 className="text-2xl font-bold">{printLang.title}</h1>
                  <p className="text-sm italic">{printLang.subtitle}</p>
                  <p className="text-xs mt-1">Sanjeevani Elder Care Patient Education Handout | Evidence Source: {printLang.evidenceSource}</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h2 className="font-bold text-sm mb-1">Overview:</h2>
                    <p>{printLang.overview}</p>
                  </div>

                  <div>
                    <h2 className="font-bold text-sm mb-1">Daily Instructions:</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      {printLang.actionableSteps.map((s, i) => (
                        <li key={i}><strong>{s.title}:</strong> {s.tips.join(' ')}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="font-bold text-sm mb-1">Diet & Lifestyle:</h2>
                    <p><strong>Recommended:</strong> {printLang.dietaryAndLifestyle.recommendations.join(', ')}</p>
                    <p><strong>Avoid:</strong> {printLang.dietaryAndLifestyle.whatToAvoid.join(', ')}</p>
                  </div>

                  <div className="border p-2 border-red-500">
                    <h2 className="font-bold text-sm text-red-600 mb-1">Danger Signs (Call 108 / Doctor):</h2>
                    <ul className="list-disc pl-5">
                      {printLang.redFlagEmergencySigns.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="font-bold text-sm mb-1">Daily Checklist:</h2>
                    <ul className="list-none space-y-1">
                      {printLang.dailyChecklist.map((c, i) => (
                        <li key={i}>[ ] {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
