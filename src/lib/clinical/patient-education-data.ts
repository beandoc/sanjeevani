export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface PatientEducationGuide {
  id: string;
  category: string;
  readingTimeMinutes: number;
  en: {
    title: string;
    subtitle: string;
    overview: string;
    whyItMatters: string;
    actionableSteps: {
      title: string;
      description: string;
      tips: string[];
    }[];
    dietaryAndLifestyle: {
      recommendations: string[];
      whatToAvoid: string[];
    };
    medicationPearls: string[];
    redFlagEmergencySigns: string[];
    dailyChecklist: string[];
    evidenceSource: string;
  };
  hi: {
    title: string;
    subtitle: string;
    overview: string;
    whyItMatters: string;
    actionableSteps: {
      title: string;
      description: string;
      tips: string[];
    }[];
    dietaryAndLifestyle: {
      recommendations: string[];
      whatToAvoid: string[];
    };
    medicationPearls: string[];
    redFlagEmergencySigns: string[];
    dailyChecklist: string[];
    evidenceSource: string;
  };
  mr: {
    title: string;
    subtitle: string;
    overview: string;
    whyItMatters: string;
    actionableSteps: {
      title: string;
      description: string;
      tips: string[];
    }[];
    dietaryAndLifestyle: {
      recommendations: string[];
      whatToAvoid: string[];
    };
    medicationPearls: string[];
    redFlagEmergencySigns: string[];
    dailyChecklist: string[];
    evidenceSource: string;
  };
}

export const patientEducationGuides: PatientEducationGuide[] = [
  {
    id: 'hypertension-home-care',
    category: 'Cardiovascular',
    readingTimeMinutes: 4,
    en: {
      title: 'High Blood Pressure Care at Home',
      subtitle: 'Easy steps to measure BP correctly, eat less salt, and prevent dizziness.',
      overview: 'Blood pressure often increases with age as blood vessels become stiffer. Keeping blood pressure in a safe range protects against heart attacks, paralysis (stroke), and kidney trouble.',
      whyItMatters: 'If blood pressure drops too fast when standing up, an elder can feel dizzy and fall down. We must manage BP safely without causing fainting.',
      actionableSteps: [
        {
          title: 'How to Check Blood Pressure at Home',
          description: 'Measure twice a day (morning before morning tea/medicines, and evening before dinner).',
          tips: [
            'Sit quietly on a chair with your back supported and feet on the ground for 5 minutes before checking.',
            'Keep your arm on a table at chest level. Do not speak or use your phone while the machine is running.',
            'Take 2 readings 1 minute apart and write down the average.'
          ]
        },
        {
          title: 'The 30-Second Sit-to-Stand Rule (Stop Dizziness)',
          description: 'Prevent sudden head-spinning when getting out of bed:',
          tips: [
            'Sit on the edge of the bed for 30 to 60 seconds before standing up.',
            'Move your feet up and down 10 times to get the blood flowing.',
            'If you feel lightheaded, immediately sit back down and take slow deep breaths.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'Use lemon, garlic, roasted jeera, and herbs to give taste to dal and sabzi with less salt.',
          'Eat seasonal fruits, steamed vegetables, and bottle gourd (lauki).',
          'Aim for less than 1 small teaspoon of salt for the entire day.'
        ],
        whatToAvoid: [
          'Commercial pickles (achaar), papad, salted namkeen, chips, and packet soups.',
          'Taking sudden very hot baths which can cause blood pressure to fall and cause fainting.'
        ]
      },
      medicationPearls: [
        'Take your blood pressure tablets at the exact same time every day. Never stop medicine on your own just because the reading looks normal.'
      ],
      redFlagEmergencySigns: [
        'Upper BP number above 180 with severe headache, chest pain, or blurred vision.',
        'Sudden weakness in one arm, face drooping, or trouble speaking clearly (Stroke warning).',
        'Upper BP number dropping below 90 with severe weakness, cold sweating, or fainting.'
      ],
      dailyChecklist: [
        'Morning BP checked and noted down',
        'BP medicines taken with water on time',
        'Took a gentle 15-minute walk or seated leg exercise',
        'Elevated legs on a pillow for 20 minutes in the evening'
      ],
      evidenceSource: 'WHO & ICMR Senior Blood Pressure Guidelines'
    },
    hi: {
      title: 'घर पर ब्लड प्रेशर (BP) की सही देखभाल',
      subtitle: 'बीपी नापने का सही तरीका, नमक कम करने के उपाय और चक्कर आने से बचाव।',
      overview: 'उम्र बढ़ने पर खून की नलियां सख्त हो जाती हैं जिससे बीपी बढ़ सकता है। सही बीपी रखने से लकवा (स्ट्रोक), हार्ट अटैक और गुर्दे की बीमारी से बचाव होता है।',
      whyItMatters: 'अगर बुजुर्ग अचानक खड़े होते हैं और बीपी एकदम गिर जाए, तो चक्कर आकर गिरने और हड्डी टूटने का खतरा रहता है।',
      actionableSteps: [
        {
          title: 'घर पर बीपी नापने का सही नियम',
          description: 'दिन में दो बार नापें (सुबह चाय/दवा से पहले और शाम को खाने से पहले):',
          tips: [
            'नापने से पहले 5 मिनट कुर्सी पर आराम से बैठें, पीठ सीधी और पैर जमीन पर रखें।',
            'हाथ को टेबल पर दिल की ऊंचाई पर रखें। नापते समय बात न करें और मोबाइल न चलाएं।',
            'एक-एक मिनट के अंतर पर 2 बार नापें और दोनों का औसत लिख लें।'
          ]
        },
        {
          title: 'बिस्तर से उठते समय चक्कर रोकने का नियम (30 सेकंड रुकें)',
          description: 'सुबह उठते ही सिर घूमने से बचने का आसान तरीका:',
          tips: [
            'सोकर उठने के बाद सीधे खड़े न हों; पहले 30 से 60 सेकंड बिस्तर के किनारे बैठें।',
            'पैरों के पंजों को 10 बार ऊपर-नीचे हिलाएं ताकि खून का दौरा चालू हो जाए।',
            'अगर फिर भी चक्कर लगे, तो तुरंत वापस बैठ जाएं और एक घूंट पानी पिएं।'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'दाल और सब्जी में नमक कम डालें; स्वाद के लिए नींबू, भुना जीरा, लहसुन और हरी धनिया का इस्तेमाल करें।',
          'ताजे मौसमी फल, लौकी, तोरई, पालक और उबली सब्जियां खाएं।',
          'पूरे दिन में एक छोटे चम्मच (5 ग्राम) से ज्यादा नमक न खाएं।'
        ],
        whatToAvoid: [
          'बाजार का अचार, पापड़, नमकीन, चिप्स और पैकेज्ड सूप जिनमें बहुत ज्यादा नमक छिपा होता है।',
          'बहुत गर्म पानी से नहाना, जिससे अचानक बीपी गिरकर बेहोशी आ सकती है।'
        ]
      },
      medicationPearls: [
        'डॉक्टर की लिखी बीपी की गोली रोजाना तय समय पर लें। बीपी सामान्य आने पर भी गोली खुद से बंद न करें।'
      ],
      redFlagEmergencySigns: [
        'ऊपर का बीपी 180 से ज्यादा हो और साथ में तेज सिरदर्द, सीने में भारीपन या धुंधला दिखना हो।',
        'अचानक चेहरे का एक तरफ टेढ़ा होना, एक हाथ में कमजोरी या आवाज लड़खड़ाना (लकवे का लक्षण)।',
        'ऊपर का बीपी 90 से नीचे गिर जाना और साथ में ठंडा पसीना या बेहोशी आना।'
      ],
      dailyChecklist: [
        'सुबह का बीपी नापकर संजीवनी में नोट किया',
        'बीपी की गोली समय पर पानी के साथ ली',
        '15 मिनट टहले या कुर्सी पर बैठकर हल्के व्यायाम किए',
        'शाम को 20 मिनट पैरों के नीचे तकिया रखकर आराम किया'
      ],
      evidenceSource: 'विश्व स्वास्थ्य संगठन (WHO) और ICMR गाइडलाइन्स'
    },
    mr: {
      title: 'घरी रक्तदाब (BP) नियंत्रणात ठेवण्याची सोपी पद्धत',
      subtitle: 'बीपी तपासण्याची योग्य पद्धत, मीठ कमी करण्याचे उपाय आणि चक्कर येणे टाळणे.',
      overview: 'वय वाढल्यामुळे रक्तवाहिन्या कडक होतात आणि रक्तदाब वाढू लागतो. योग्य रक्तदाब राखल्याने पक्षाघात (स्ट्रोक), हृदयविकार आणि किडनीच्या आजारांपासून रक्षण होते.',
      whyItMatters: 'उभे राहताना जर रक्तदाब अचानक कमी झाला तर चक्कर येऊन तोल जाण्याची आणि हाड मोडण्याची भीती असते.',
      actionableSteps: [
        {
          title: 'घरी योग्य प्रकारे रक्तदाब तपासणे',
          description: 'दिवसातून दोनदा तपासा (सकाळी चहा/औषधापूर्वी आणि संध्याकाळी जेवणापूर्वी):',
          tips: [
            'तपासण्यापूर्वी ५ मिनिटे खुर्चीवर शांत बसा, पाठ टेकवा आणि पाय जमिनीवर सपाट ठेवा.',
            'हात टेबलावर छातीच्या पातळीवर ठेवा. मशीन चालू असताना बोलू नका.',
            '१ मिनिटाच्या अंतराने २ वेळा तपासा आणि सरासरी लिहून ठेवा.'
          ]
        },
        {
          title: 'उठताना चक्कर टाळण्यासाठी ३० सेकंदांचा नियम',
          description: 'झोपेतून उठल्यावर डोके गरगरणे थांबवण्यासाठी:',
          tips: [
            'सकाळी उठल्या उठल्या थेट उभे राहू नका; प्रथम ३० ते ६० सेकंद खाटेच्या कडेला बसा.',
            'पायांचे पंजे १० वेळा वर-खाली हलवा जेणेकरून रक्ताभिसरण नीट सुरू होईल.',
            'चक्कर येत असल्यास लगेच परत बसा आणि दीर्घ श्वास घ्या.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'वरण आणि भाजीत मीठ कमी घाला; चवीसाठी लिंबू, भाजलेले जिरे, लसूण आणि कोथिंबीर वापरा.',
          'ताजी फळे, दुधी भोपळा, पडवळ आणि पालेभाज्या खा.',
          'संपूर्ण दिवसात १ लहान चमच्यापेक्षा (५ ग्रॅम) जास्त मीठ खाऊ नये.'
        ],
        whatToAvoid: [
          'लोणचे, पापड, फरसाण, शेव, चिप्स आणि खारट पदार्थ टाळा.',
          'अतिशय गरम पाण्याने आंघोळ करणे टाळा, यामुळे अचानक बीपी कमी होऊ शकतो.'
        ]
      },
      medicationPearls: [
        'डॉक्टरांनी दिलेली बीपीची गोळी दररोज ठरलेल्या वेळेवरच घ्या. बीपी नॉर्मल आला तरी गोळी स्वतःहून बंद करू नका.'
      ],
      redFlagEmergencySigns: [
        'वरचा बीपी १८० पेक्षा जास्त आणि सोबत डोकेदुखी, छातीत दुखणे किंवा अंधारी येणे.',
        'चेहरा एका बाजूला वाकडा होणे, एका हातात ताकद न राहणे किंवा बोलताना जीभ जड होणे (पक्षाघाताचे लक्षण).',
        'वरचा बीपी ९० च्या खाली जाणे आणि सोबत गार घाम किंवा चक्कर येणे.'
      ],
      dailyChecklist: [
        'सकाळी बीपी तपासून नोंद केली',
        'बीपीची गोळी वेळेवर पाण्यासोबत घेतली',
        '१५ मिनिटे सावकाश चालणे किंवा हलका व्यायाम केला',
        'संध्याकाळी पाय उशीवर ठेवून २० मिनिटे विश्रांती घेतली'
      ],
      evidenceSource: 'जागतिक आरोग्य संघटना (WHO) आणि ICMR मार्गदर्शक तत्त्वे'
    }
  },
  {
    id: 'diabetes-hypoglycemia-safety',
    category: 'Diabetes & Metabolism',
    readingTimeMinutes: 5,
    en: {
      title: 'Sugar Care & Avoiding Low Blood Sugar',
      subtitle: 'How to treat low sugar in 15 minutes and protect senior feet every day.',
      overview: 'In older adults, blood sugar dropping too low (hypoglycemia) is very dangerous and can cause sudden confusion, shivering, and falls. Preventing low sugar is our top goal.',
      whyItMatters: 'Low sugar can look just like a stroke or sudden weakness. Elders must never skip meals after taking insulin or diabetes tablets.',
      actionableSteps: [
        {
          title: 'The 15-Minute Rule for Low Sugar (Under 70 mg/dL)',
          description: 'If shivering, sweating, feeling very hungry, or confused:',
          tips: [
            'Immediately give 3 teaspoons of sugar dissolved in water, or 1/2 cup fruit juice, or 4 glucose biscuits.',
            'Rest quietly for 15 minutes and check blood sugar again.',
            'If still under 70, repeat once more. Once sugar is normal, give a small snack like roti-dal or milk.'
          ]
        },
        {
          title: 'Daily 5-Point Foot Check',
          description: 'Diabetes reduces pain feeling in feet; small cuts can turn into big sores:',
          tips: [
            'Look at the top of feet, soles, and between all toes every evening.',
            'Wash feet with lukewarm water and pat dry gently (especially between toes).',
            'Always wear soft, comfortable slippers inside the house—never walk barefoot.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'Eat whole wheat roti, oats, daliya, brown rice, and lots of green vegetables.',
          'Eat protein with every meal (moong dal, paneer, boiled egg white, curd) to keep energy steady.'
        ],
        whatToAvoid: [
          'Walking barefoot on marble, tile, or temple floors.',
          'Skipping lunch or dinner after taking diabetes medicines or insulin.'
        ]
      },
      medicationPearls: [
        'Always keep 2-3 sugar candies or a small pouch of sugar in your pocket when going out.'
      ],
      redFlagEmergencySigns: [
        'Person becomes unconscious or cannot swallow during low sugar (Do NOT force liquid into mouth; call 108).',
        'Black skin, bad smell, or an open wound on foot or toes that does not heal.',
        'Blood sugar above 350 with vomiting and deep heavy breathing.'
      ],
      dailyChecklist: [
        'Fasting or post-meal sugar checked as advised',
        'Medicines/insulin taken on time with food',
        'Feet checked and moisturized on heels',
        'Sugar packet confirmed present in pocket or purse'
      ],
      evidenceSource: 'ICMR & American Diabetes Association (ADA) Senior Guidelines'
    },
    hi: {
      title: 'डायबिटीज की देखभाल और लो शुगर से बचाव',
      subtitle: 'लो शुगर को 15 मिनट में ठीक करने का नियम और पैरों की रोजाना देखभाल।',
      overview: 'बुजुर्गों में शुगर का बहुत कम हो जाना (लो शुगर) बहुत खतरनाक होता है। इससे अचानक घबराहट, पसीना आना, चक्कर और गिरने का खतरा रहता है।',
      whyItMatters: 'शुगर गिरने पर कभी-कभी लकवे जैसा भ्रम होता है। बुजुर्गों को इंसुलिन या दवा लेने के बाद खाना खाने में कभी देर नहीं करनी चाहिए।',
      actionableSteps: [
        {
          title: 'लो शुगर का 15 मिनट वाला नियम (शुगर 70 से कम होने पर)',
          description: 'अगर हाथ कांपें, पसीना छूटे, बहुत भूख लगे या घबराहट हो:',
          tips: [
            'तुरंत 3 चम्मच चीनी पानी में घोलकर पिलाएं, या आधा गिलास फलों का जूस या 4 ग्लूकोज बिस्किट खिलाएं।',
            '15 मिनट शांत बैठाएं और फिर से शुगर नापें।',
            'अगर अभी भी 70 से कम हो तो दोबारा मीठा दें। ठीक होने पर रोटी-दाल या दूध जैसा हल्का खाना दें।'
          ]
        },
        {
          title: 'रोजाना पैरों की 5 जगह जांच',
          description: 'डायबिटीज में पैरों का दर्द महसूस नहीं होता, इसलिए छोटी चोट भी बड़ा घाव बन सकती है:',
          tips: [
            'रोज शाम को पैरों के तलवे, उंगलियों के बीच और एड़ी को अच्छी तरह देखें।',
            'पैरों को गुनगुने पानी से धोकर तौलिए से थपथपाकर सुखाएं (उंगलियों के बीच सूखा रखें)।',
            'घर के अंदर भी कभी नंगे पैर न चलें; हमेशा मुलायम चप्पल पहनें।'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'रोटी, दलिया, ओट्स, दाल और हरी पत्तेदार सब्जियां खाएं।',
          'हर खाने में मूंग दाल, पनीर, उबला अंडा या दही जरूर शामिल करें ताकि ताकत बनी रहे।'
        ],
        whatToAvoid: [
          'संगमरमर या फर्श पर नंगे पैर चलना।',
          'दवा या इंसुलिन लेने के बाद खाना छोड़ना या बहुत देर से खाना।'
        ]
      },
      medicationPearls: [
        'घर से बाहर निकलते समय जेब या पर्स में हमेशा 2-3 ग्लूकोज टॉफी या चीनी की पुड़िया रखें।'
      ],
      redFlagEmergencySigns: [
        'शुगर गिरने पर मरीज बेहोश हो जाए या निगल न पाए (बेहोश मरीज के मुंह में पानी न डालें; तुरंत 108 पर फोन करें)।',
        'पैर की उंगली या तलवे में कालापन, बदबू या न भरने वाला घाव होना।',
        'शुगर 350 से ऊपर हो और उल्टी या भारी सांसें आ रही हों।'
      ],
      dailyChecklist: [
        'खाली पेट या खाने के बाद की शुगर नापी',
        'दवा/इंसुलिन समय पर खाने के साथ ली',
        'पैरों के तलवों और उंगलियों की जांच की',
        'जेब में चीनी की पुड़िया/टॉफी रखी'
      ],
      evidenceSource: 'ICMR और ADA सीनियर डायबिटीज केयर गाइडलाइन्स'
    },
    mr: {
      title: 'मधुमेह आणि साखर कमी होण्यापासून (लो शुगर) संरक्षण',
      subtitle: 'लो शुगर १५ मिनिटांत कशी नियंत्रणात आणावी आणि पायांची रोज काळजी कशी घ्यावी.',
      overview: 'ज्येष्ठांमध्ये रक्तातील साखर खूप कमी होणे (हायपोग्लायसेमिया) अत्यंत धोकादायक असते. यामुळे अचानक थरकाप, घाम फुटणे, गोंधळ उडणे आणि तोल जाऊन पडणे होऊ शकते.',
      whyItMatters: 'साखर कमी झाल्यामुळे पक्षाघातासारखी लक्षणे दिसू शकतात. गोळी किंवा इन्सुलिन घेतल्यानंतर जेवण्यास कधीही उशीर करू नये.',
      actionableSteps: [
        {
          title: 'लो शुगरसाठी १५ मिनिटांचा नियम (साखर ७० पेक्षा कमी असल्यास)',
          description: 'हात थरथरत असल्यास, घाम फुटल्यास किंवा खूप भूक लागल्यास:',
          tips: [
            'लगेच ३ चमचे साखर पाण्यात विरघळवून प्यायला द्या, किंवा अर्धा कप फळांचा रस किंवा ४ ग्लुकोज बिस्किटे द्या.',
            '१५ मिनिटे शांत बसा आणि पुन्हा साखर तपासा.',
            'साखर अजूनही ७० च्या खाली असल्यास पुन्हा गोड द्या. साखर पूर्ववत झाल्यावर थोडे जेवण (पोळी-वरण किंवा दूध) द्या.'
          ]
        },
        {
          title: 'पायांची रोज ५ ठिकाणी तपासणी',
          description: 'मधुमेहामध्ये पायांची संवेदना कमी होते, त्यामुळे छोटी जखमही मोठी होऊ शकते:',
          tips: [
            'रोज संध्याकाळी पायांचे तळवे, टाचा आणि बोटांमधील जागा नीट तपासा.',
            'कोमट पाण्याने पाय धुवा आणि मऊ कपड्याने पुसून कोरडे करा.',
            'घरामध्येही कधीही अनवाणी फिरू नका; नेहमी मऊ स्लिपर वापरा.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'गव्हाची पोळी, ज्वारीची भाकरी, डाळी आणि भरपूर हिरव्या भाज्या खा.',
          'प्रत्येक जेवणात मूग डाळ, पनीर, उकडलेले अंडे किंवा दही ठेवा जेणेकरून ताकद राहील.'
        ],
        whatToAvoid: [
          'घरात किंवा बाहेर अनवाणी पायाने चालणे.',
          'इन्सुलिन किंवा गोळी घेतल्यानंतर जेवण टाळणे किंवा उशीर करणे.'
        ]
      },
      medicationPearls: [
        'बाहेर पडताना खिशात किंवा पर्समध्ये नेहमी २-३ गोड गोळ्या किंवा साखरेची पुडी ठेवा.'
      ],
      redFlagEmergencySigns: [
        'साखर कमी होऊन रुग्ण बेशुद्ध पडल्यास (बेशुद्ध व्यक्तीच्या तोंडात पाणी किंवा साखर घालू नका; लगेच १०८ वर फोन करा).',
        'पायाच्या बोटांना काळे पडणे किंवा न भरून येणारी जखम होणे.',
        'साखर ३५० च्या वर जाऊन उलट्या किंवा धाप लागणे.'
      ],
      dailyChecklist: [
        'रक्तातील साखर तपासली',
        'औषध/इन्सुलिन जेवणासोबत वेळेवर घेतले',
        'पायांची तपासणी केली आणि टाचांना क्रीम लावले',
        'खिशात साखरेची पुडी/गोळी असल्याची खात्री केली'
      ],
      evidenceSource: 'ICMR आणि ज्येष्ठ नागरिक मधुमेह मार्गदर्शक तत्त्वे'
    }
  },
  {
    id: 'steadi-fall-prevention',
    category: 'Mobility & Falls',
    readingTimeMinutes: 4,
    en: {
      title: 'Preventing Falls & Making Home Safe',
      subtitle: 'Simple home safety checks, easy leg exercises, and what to do if a fall happens.',
      overview: 'Falling is NOT a normal part of getting older. Most falls happen at home because of loose rugs, wet bathroom floors, poor lights, or weak leg muscles. Simple changes prevent falls.',
      whyItMatters: 'A fall can break the hip bone and keep an elder in bed for months. Preventing falls keeps seniors walking independently.',
      actionableSteps: [
        {
          title: 'Easy Home Safety Fixes',
          description: 'Make these changes in your home today:',
          tips: [
            'Bathroom: Put sturdy grab bars near the toilet and shower; use rubber anti-slip mats.',
            'Lights: Keep a small night-light on in the hallway between bedroom and bathroom.',
            'Floor: Remove all loose mats, door rugs, wires, and slippers from walking paths.',
            'Footwear: Wear shoes or slippers with a closed back and rubber non-slip sole.'
          ]
        },
        {
          title: '3 Daily Simple Balance Exercises (Hold a Sturdy Chair)',
          description: 'Practice for 5 minutes every day:',
          tips: [
            'Chair Stand: Stand up from a dining chair without using your hands 5 times.',
            'Heel-to-Toe Stand: Stand with one foot in front of the other for 10 seconds.',
            'Knee Lift: Hold the chair and lift one knee up for 5 seconds; repeat with other leg.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'Get 15 minutes of gentle morning sunlight for Vitamin D and drink milk or curd for Calcium.',
          'Drink 6 to 8 glasses of water during the day to prevent weakness and dehydration.'
        ],
        whatToAvoid: [
          'Walking in the dark at night without turning on the light.',
          'Climbing on stools or chairs to reach high cupboards.'
        ]
      },
      medicationPearls: [
        'Ask the doctor to review all medicines that cause dizziness or sleepiness.'
      ],
      redFlagEmergencySigns: [
        'Elder fell and cannot stand or put weight on the leg; leg looks turned outward or shortened (Hip fracture).',
        'Hit head during fall, vomiting, or sudden drowsiness (Call 108 immediately).'
      ],
      dailyChecklist: [
        'Night-lights checked and turned on before bed',
        'Floors clear of water spills, clothes, and wires',
        '5 minutes of chair-stand exercise done',
        'Spectacles cleaned and placed on bedside table'
      ],
      evidenceSource: 'CDC STEADI Protocol & World Falls Guidelines'
    },
    hi: {
      title: 'घर में फिसलने और गिरने से बचाव',
      subtitle: 'घर को सुरक्षित बनाने के आसान तरीके, पैरों की कसरत और गिरने पर क्या करें।',
      overview: 'उम्र बढ़ने पर गिरना कोई आम बात नहीं है। ज्यादातर बुजुर्ग गीले बाथरूम, ढीले पायदान, अंधेरे या कमजोर पैरों की वजह से गिरते हैं। थोड़े से बदलाव से 70% हादसे रोके जा सकते हैं।',
      whyItMatters: 'एक बार गिरने पर कूल्हे की हड्डी टूट सकती है, जिससे महीनों बिस्तर पर रहना पड़ सकता है। गिरने से बचाकर बुजुर्गों को आत्मनिर्भर रखें।',
      actionableSteps: [
        {
          title: 'घर को सुरक्षित बनाने के आसान उपाय',
          description: 'आज ही अपने घर में ये जरूरी बदलाव करें:',
          tips: [
            'बाथरूम: टॉयलेट और नहाने की जगह मजबूत ग्रैब बार (हैंडल) लगवाएं और रबर का एंटी-स्लिप मैट बिछाएं।',
            'रोशनी: कमरे से बाथरूम तक रात में जलने वाला हल्का नाइट बल्ब जरूर जलाएं।',
            'फर्श: फर्श से ढीले पायदान, जमीन पर फैले तार और चप्पलें हटाकर रास्ता साफ रखें।',
            'चप्पल: पीछे से खुली ढीली चप्पल न पहनें; ग्रिप वाली रबर की चप्पल पहनें।'
          ]
        },
        {
          title: 'पैरों की ताकत के लिए 3 आसान कसरत (कुर्सी पकड़कर)',
          description: 'रोज 5 मिनट कुर्सी के सहारे ये करें:',
          tips: [
            'कुर्सी से उठना-बैठना: बिना हाथ का सहारा लिए कुर्सी से 5 बार खड़े हों और बैठें।',
            'एक लाइन में खड़े होना: एक पैर के ठीक आगे दूसरा पैर रखकर 10 सेकंड संतुलन बनाएं।',
            'घुटना उठाना: कुर्सी पकड़कर एक घुटना 5 सेकंड के लिए ऊपर उठाएं, फिर दूसरा।'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'हड्डियों की मजबूती के लिए सुबह 15 मिनट धूप में बैठें, दूध, दही और रागी खाएं।',
          'दिनभर में 6-7 गिलास पानी और तरल पदार्थ पिएं ताकि कमजोरी न आए।'
        ],
        whatToAvoid: [
          'रात में बिना लाइट जलाए अंधेरे में चलना।',
          'ऊपर का सामान उतारने के लिए स्टूल या प्लास्टिक की कुर्सी पर चढ़ना।'
        ]
      },
      medicationPearls: [
        'नींद की गोली या चक्कर लाने वाली दवाओं के बारे में डॉक्टर से सलाह लें।'
      ],
      redFlagEmergencySigns: [
        'गिरने के बाद पैर पर वजन न दे पाना या पैर बाहर की तरफ मुड़ा दिखना (कूल्हे की हड्डी टूटना)।',
        'गिरते समय सिर पर चोट लगना, उल्टी आना या बहुत ज्यादा सुस्ती छाना (तुरंत 108 पर फोन करें)।'
      ],
      dailyChecklist: [
        'सोने से पहले नाइट बल्ब जलाया',
        'रास्ते में कोई पानी, तार या कपड़ा नहीं है',
        '5 मिनट कुर्सी वाली कसरत पूरी की',
        'चश्मा साफ करके सिरहाने पर रखा'
      ],
      evidenceSource: 'CDC STEADI और वर्ल्ड फॉल्स प्रिवेंशन गाइडलाइन्स'
    },
    mr: {
      title: 'घरात पडणे टाळणे आणि घर सुरक्षित करणे',
      subtitle: 'घर सुरक्षित करण्याचे सोपे उपाय, पायांचे व्यायाम आणि पडल्यास काय करावे.',
      overview: 'वय झाले की पडणे अपरिहार्य नाही. बहुतेक ज्येष्ठ नागरिक निसरड्या बाथरूममध्ये, अंधारात किंवा पायात ताकद नसल्यामुळे पडतात. साध्या उपायांनी हे टाळता येते.',
      whyItMatters: 'पडल्यामुळे खुब्याचे हाड मोडू शकते आणि महिनोनमहिने अंथरुणाला खिळावे लागू शकते. ज्येष्ठांचे चालणे चालू ठेवणे हेच आपले ध्येय आहे.',
      actionableSteps: [
        {
          title: 'घरामध्ये करावयाचे सोपे सुरक्षित बदल',
          description: 'आजच घरामध्ये हे बदल करा:',
          tips: [
            'बाथरूम: संडास आणि बाथरुममध्ये पकडण्यासाठी मजबूत हँडल्स (ग्रॅब बार) लावा आणि रबरी मॅट वापरा.',
            'प्रकाश: बेडरूम ते बाथरूमच्या मार्गावर रात्री मंद दिवा चालू ठेवा.',
            'फरशी: निसरडे पायपुसणे, जमिनीवर पडलेल्या वायर आणि वस्तू बाजूला करा.',
            'चप्पल: मागे पट्टा असलेली, रबरी तळ असलेली न घसरणारी चप्पल वापरा.'
          ]
        },
        {
          title: 'पायांच्या ताकदीसाठी ३ सोपे व्यायाम (खुर्ची पकडून)',
          description: 'दररोज ५ मिनिटे करा:',
          tips: [
            'खुर्चीवरून उठणे-बसणे: हाताचा आधार न घेता खुर्चीवरून ५ वेळा उभे राहा आणि बसा.',
            'एका रेषेत उभे राहणे: एका पायाच्या पुढे दुसरा पाय ठेवून १० सेकंद तोल सांभाळा.',
            'गुडघा वर करणे: खुर्ची पकडून एक गुडघा ५ सेकंद वर धरा, नंतर दुसरा पाय करा.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'हाडांसाठी सकाळच्या कोवळ्या उन्हात १५ मिनिटे बसा, दूध, ताक, नाचणीची भाकरी खा.',
          'दिवसभरात ६-८ ग्लास पाणी किंवा पातळ पदार्थ प्या.'
        ],
        whatToAvoid: [
          'रात्री अंधारात लाइट न लावता चालणे.',
          'वरची वस्तू काढण्यासाठी स्टूल किंवा खुर्चीवर चढणे.'
        ]
      },
      medicationPearls: [
        'झोपेच्या किंवा चक्कर आणणाऱ्या औषधांविषयी डॉक्टरांशी चर्चा करा.'
      ],
      redFlagEmergencySigns: [
        'पडल्यानंतर पायावर उभे राहता न येणे किंवा पाय वाकडा दिसणे (हाड मोडल्याची भीती).',
        'पडताना डोक्याला मार लागणे, उलट्या होणे किंवा गुंगी येणे (लगेच १०८ वर फोन करा).'
      ],
      dailyChecklist: [
        'रात्रीचा दिवा चालू केला',
        'घरातील चालण्याचा मार्ग मोकळा आणि कोरडा आहे',
        '५ मिनिटे खुर्चीचे व्यायाम केले',
        'चष्मा उशाजवळ टेबलावर ठेवला'
      ],
      evidenceSource: 'CDC STEADI आणि जागतिक फॉल्स प्रिव्हेंशन मार्गदर्शक तत्त्वे'
    }
  },
  {
    id: 'dementia-memory-behavior-guide',
    category: 'Cognitive Care',
    readingTimeMinutes: 5,
    en: {
      title: 'Dementia & Memory Care for Families',
      subtitle: 'How to talk with love, calm evening restlessness, and protect from wandering.',
      overview: 'Caring for a family member with memory loss (dementia or Alzheimer’s) requires patience and love. Remember that memory lapses and repeated questions are caused by brain illness, not stubbornness.',
      whyItMatters: 'Arguing or saying "try to remember" causes severe anxiety, anger, and crying. Talking with gentle validation keeps your loved one calm and happy.',
      actionableSteps: [
        {
          title: 'Golden Rules for Talking to Memory Patients',
          description: 'Connect with feelings instead of arguing about facts:',
          tips: [
            'Never Say: "Don\'t you remember?" or "I told you just now." This makes them feel scared.',
            'Agree and Redirect: If they ask for their childhood home, say: "Tell me about your home," then gently offer a cup of tea or a family photo.',
            'Speak in short, calm sentences and smile warmly.'
          ]
        },
        {
          title: 'Calming Evening Restlessness (Sundowning)',
          description: 'Elders often get confused or agitated around sunset:',
          tips: [
            'Turn on bright, warm room lights and draw curtains at 4:30 PM before shadows fall.',
            'Play soft bhajans, old favorite songs, or soothing music.',
            'Give a warm cup of milk and sit together looking at familiar photo albums.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'Serve soft finger foods (small idlis, paneer pieces, cutlets) if using spoons becomes hard.',
          'Use brightly colored plates (like red or blue) so food is clearly visible.'
        ],
        whatToAvoid: [
          'Strong tea, coffee, or sugary sweets after 4 PM.',
          'Loud TV news or noisy rooms with too many people talking at once.'
        ]
      },
      medicationPearls: [
        'Keep medicines in a locked box; administer them directly so pills are not forgotten or double-taken.'
      ],
      redFlagEmergencySigns: [
        'Sudden extreme confusion or hallucinations developing in 1-2 days (indicates urine infection or pneumonia, not just memory loss).',
        'Choking, coughing, or sputtering repeatedly while drinking water.'
      ],
      dailyChecklist: [
        'Talked with a warm smile and calm voice',
        'Medicines given directly with breakfast and dinner',
        'Lights turned on before 5 PM to prevent evening fear',
        'Main house doors safely locked with ID card in pocket'
      ],
      evidenceSource: 'ARDSI & NICE Dementia Guidelines'
    },
    hi: {
      title: 'याददाश्त की कमजोरी और डिमेंशिया की देखभाल',
      subtitle: 'प्यार से बात करने का तरीका, शाम की बेचैनी शांत करना और भटकने से बचाना।',
      overview: 'जब घर के बुजुर्ग को भूलने की बीमारी (डिमेंशिया या अल्जाइमर) होती है, तो वे पुरानी बातें भूल सकते हैं या एक ही बात बार-बार पूछते हैं। यह उनकी गलती नहीं, बल्कि बीमारी का असर है।',
      whyItMatters: 'बुजुर्ग से बहस करने या "आपको याद क्यों नहीं रहता" कहने से वे डर जाते हैं और गुस्सा करने लगते हैं। प्यार और सहानुभूति से उन्हें हमेशा शांत रखा जा सकता है।',
      actionableSteps: [
        {
          title: 'भूलने की बीमारी में बात करने के जरूरी नियम',
          description: 'बहस करने की बजाय उनकी भावनाओं को समझें:',
          tips: [
            'कभी न कहें: "आपको याद नहीं?" या "अभी तो बताया था।" इससे वे शर्मिंदा और भयभीत होते हैं।',
            'बात मोड़ें: अगर वे कहें "मुझे अपने गांव जाना है", तो कहें "हां, गांव बहुत सुंदर है, मुझे गांव की बात बताओ", फिर प्यार से चाय या नाश्ता दें।',
            'छोटे और आसान वाक्यों में धीमी और मीठी आवाज में बात करें।'
          ]
        },
        {
          title: 'शाम की बेचैनी (सनडाउनिंग) शांत करने के उपाय',
          description: 'सूरज ढलते समय बुजुर्ग अक्सर घबराने और घर जाने की जिद करने लगते हैं:',
          tips: [
            'शाम 4:30 बजे ही कमरों की लाइटें जला दें और पर्दे खींच दें ताकि परछाइयों से डर न लगे।',
            'धीमी आवाज में पुराने पसंदीदा गाने, भजन या शांत संगीत चलाएं।',
            'हल्का गर्म दूध दें और पुरानी पारिवारिक फोटो एलबम दिखाकर प्यार से बात करें।'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'अगर चम्मच से खाना मुश्किल हो, तो हाथ से खाने वाले सॉफ्ट फूड्स (इडली के टुकड़े, पनीर, कटलेट) दें।',
          'चमकीली या रंगीन प्लेट में खाना दें ताकि खाना साफ दिखाई दे।'
        ],
        whatToAvoid: [
          'शाम 4 बजे के बाद तेज चाय, कॉफी या मीठा देना।',
          'घर में बहुत तेज टीवी या बहुत सारे लोगों का एक साथ शोर मचाना।'
        ]
      },
      medicationPearls: [
        'दवाइयां हमेशा ताले में रखें और अपने सामने पानी से खिलाएं ताकि कोई गोली छूटे या दो बार न खाई जाए।'
      ],
      redFlagEmergencySigns: [
        '1-2 दिन में अचानक बहुत ज्यादा बहकी-बहकी बातें करना (यह यूरिन इन्फेक्शन का लक्षण हो सकता है)।',
        'पानी पीते समय बार-बार खांसी आना या गले में फंदा लगना (डॉक्टर को दिखाएं)।'
      ],
      dailyChecklist: [
        'प्यार और मुस्कान के साथ दिन की शुरुआत की',
        'दवाएं अपने हाथ से खिलाईं',
        'शाम 5 बजे से पहले रोशनी जलाई ताकि बेचैनी न हो',
        'घर का मुख्य दरवाजा सुरक्षित रखा और जेब में नाम-फोन नंबर की पर्ची रखी'
      ],
      evidenceSource: 'ARDSI (अल्जाइमर सोसाइटी ऑफ इंडिया) और NICE दिशानिर्देश'
    },
    mr: {
      title: 'स्मरणशक्ती कमी होणे आणि डिमेंशियाची घरगुती काळजी',
      subtitle: 'प्रेमाने संवाद साधणे, संध्याकाळची अस्वस्थता कमी करणे आणि सुरक्षित ठेवणे.',
      overview: 'घरातील ज्येष्ठांना विस्मरण (डिमेंशिया किंवा अल्झायमर) झाल्यास ते वारंवार एकाच गोष्टी विचारू शकतात. हा त्यांच्या मेंदूचा आजार आहे, ते मुद्दाम करत नाहीत हे समजून घेणे आवश्यक आहे.',
      whyItMatters: 'त्यांच्याशी वाद घातल्यास किंवा "तुमच्या लक्षात कसे राहत नाही" म्हटल्यास ते घाबरतात आणि चिडचिड करतात. प्रेमाने समजून घेतल्यास ते शांत राहतात.',
      actionableSteps: [
        {
          title: 'डिमेंशिया रुग्णाशी बोलण्याचे सोनेरी नियम',
          description: 'तथ्यांवर वाद घालण्यापेक्षा त्यांच्या भावनांशी जोडून घ्या:',
          tips: [
            'कधीही बोलू नका: "तुम्हाला आठवत नाही का?" यामुळे त्यांना भीती वाटते.',
            'विषय बदला: जर ते म्हणाले "मला माझ्या गावी जायचे आहे", तर म्हणा "हो, गाव खूप छान आहे, मला गावच्या गोष्टी सांगा", आणि नंतर चहा द्या.',
            'सोप्या आणि लहान वाक्यांत शांतपणे बोला.'
          ]
        },
        {
          title: 'संध्याकाळची अस्वस्थता (सनडाउनिंग) शांत करणे',
          description: 'संध्याकाळी अंधार पडताना रुग्ण बेचैन होतात आणि बाहेर पडू पाहतात:',
          tips: [
            'संध्याकाळी ४:३० वाजताच घरातील दिवे लावा आणि खिडक्यांचे पडदे लावा.',
            'शांत भजने किंवा जुनी आवडती गाणी लावा.',
            'गरम दूध द्या आणि कुटुंबाचा जुना फोटो अल्बम दाखवत गप्पा मारा.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'चमच्याने खाणे जमत नसल्यास मऊ तुकडे (इडली, पनीर, कटलेट) हाताने खाऊ द्या.',
          'रंगीत प्लेटमध्ये जेवण द्या जेणेकरून अन्न स्पष्ट दिसेल.'
        ],
        whatToAvoid: [
          'संध्याकाळी ४ नंतर कडक चहा, कॉफी किंवा खूप गोड पदार्थ.',
          'टीव्हीचा मोठा आवाज किंवा घरात खूप लोकांची एकाच वेळी गोंधळ घालणे.'
        ]
      },
      medicationPearls: [
        'औषधे कुलूपात ठेवा आणि स्वतःच्या देखरेखीखालीच पाण्यासोबत द्या.'
      ],
      redFlagEmergencySigns: [
        '१-२ दिवसांत अचानक खूप जास्त गोंधळणे किंवा नको त्या गोष्टी दिसणे (हा लघवीतील इन्फेक्शनचा त्रास असू शकतो).',
        'पाणी पिताना वारंवार ठसका लागणे किंवा खोकला येणे.'
      ],
      dailyChecklist: [
        'हसतमुखाने आणि प्रेमाने संवाद साधला',
        'औषधे स्वतःच्या देखरेखीखाली दिली',
        'संध्याकाळी ५ पूर्वी दिवे लावून भीती वाटणार नाही याची काळजी घेतली',
        'मुख्य दरवाजा बंद ठेवला आणि खिशात पत्ता-फोन नंबरची चिठ्ठी ठेवली'
      ],
      evidenceSource: 'ARDSI आणि NICE डिमेंशिया मार्गदर्शक तत्त्वे'
    }
  },
  {
    id: 'medication-safety-beers-list',
    category: 'Medication Safety',
    readingTimeMinutes: 4,
    en: {
      title: 'Medicine Safety & Avoiding Harmful Pills',
      subtitle: 'How to organize daily pills and avoid dangerous over-the-counter pain/cold medicines.',
      overview: 'As we grow older, our kidneys and liver process medicines more slowly. Taking multiple tablets without care can cause dizziness, bleeding in the stomach, and confusion.',
      whyItMatters: 'Many common pills like strong painkillers (Brufen/Diclofenac) and sleeping cough syrups are dangerous for seniors. Always check before giving them.',
      actionableSteps: [
        {
          title: 'Medicines to Avoid Without Doctor Advice',
          description: 'Common over-the-counter pills that harm older adults:',
          tips: [
            'Strong Painkillers (Combiflam, Brufen, Diclofenac): Cause stomach ulcers, bleeding, and kidney damage. Use safe paracetamol or hot fomentation instead.',
            'Cough Syrups with Sleep Medicine (Phenergan, Diphenhydramine): Cause severe confusion, urinary blockage, and midnight falls.',
            'Routine Sleeping Pills: Cause morning hangover, falls, and worsening memory.'
          ]
        },
        {
          title: 'Use a 7-Day Pill Box Organizer',
          description: 'Never miss or take double doses:',
          tips: [
            'Fill a weekly morning/afternoon/night pill box once a week at a quiet table.',
            'Never crush tablets or open capsules unless the pharmacist confirms it is safe.',
            'Take tablets with a full glass of water while sitting upright.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'Stay sitting upright for 15-20 minutes after taking pills so tablets do not stick in the food pipe.',
          'Store all medicines in a cool, dry place away from direct sunlight.'
        ],
        whatToAvoid: [
          'Sharing medicines with neighbors or family members.',
          'Stopping blood pressure, heart, or diabetes medicines suddenly without asking the doctor.'
        ]
      },
      medicationPearls: [
        'Once a year, put ALL tablets, syrups, and herbal powders in a bag and show them to the doctor to remove unneeded pills.'
      ],
      redFlagEmergencySigns: [
        'Black colored stools or vomiting brown coffee-like liquid (sign of stomach bleeding from painkillers).',
        'Sudden severe confusion or hallucinations within 2 days of starting a new tablet.',
        'Severe skin allergy rash or swollen lips/face.'
      ],
      dailyChecklist: [
        'Pills taken from correct morning/evening compartment',
        'Taken with full glass of water while sitting upright',
        'Refill medicines 5 days before bottles run out',
        'Medicine list updated on Sanjeevani app'
      ],
      evidenceSource: 'AGS Beers Criteria® (2023 Update) & STOPP/START Guidelines'
    },
    hi: {
      title: 'दवाइयों की सुरक्षा और खतरनाक दवाओं से बचाव',
      subtitle: 'दवाइयों का सही डिब्बा बनाएं और बिना डॉक्टर की दर्द/खांसी की गोलियों से बचें।',
      overview: 'उम्र बढ़ने पर किडनी और लिवर दवाइयों को धीरे-धीरे साफ करते हैं। अगर कई दवाइयां बिना सावधानी के ली जाएं, तो पेट में छाले, चक्कर और याददाश्त में उलझन हो सकती है।',
      whyItMatters: 'दुकान से मिलने वाली कुछ आम दर्द की दवाइयां (जैसे ब्रूफेन, डिक्लोफेनेक) और नींद वाले कफ सिरप बुजुर्गों के गुर्दे और दिमाग को नुकसान पहुंचा सकते हैं।',
      actionableSteps: [
        {
          title: 'बिना डॉक्टर की सलाह के इन दवाओं से बचें',
          description: 'बुजुर्गों के लिए नुकसानदेह दवाएं:',
          tips: [
            'तेज दर्द की गोलियां (कॉम्बिफ्लैम, ब्रूफेन, डिक्लोफेनेक): पेट में ब्लीडिंग और किडनी खराब कर सकती हैं। सिर्फ सादा पैरासिटामोल या सिकाई करें।',
            'नींद वाले कफ सिरप (फेनार्गन आदि): दिमाग में अचानक भ्रम, पेशाब रुकना और गिरने का खतरा बढ़ाते हैं।',
            'नींद की गोलियां: सुबह सुस्ती, चक्कर और गिरने का बड़ा कारण बनती हैं।'
          ]
        },
        {
          title: '7 दिन वाला दवाई बॉक्स (पिल बॉक्स) इस्तेमाल करें',
          description: 'दवा भूलने या दोबारा खा लेने से बचने का सही तरीका:',
          tips: [
            'हफ्ते में एक बार शांत बैठकर 7 दिन के सुबह/दोपहर/रात वाले डिब्बे में गोलियां भरें।',
            'गोली को बिना डॉक्टर/फार्मासिस्ट से पूछे कभी कूटकर या तोड़कर न दें।',
            'गोली हमेशा सीधे बैठकर पूरे एक गिलास पानी के साथ दें।'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'दवा लेने के बाद 15-20 मिनट सीधे बैठे रहें ताकि गोली खाने की नली में न चिपके।',
          'दवाइयों को सूखी और ठंडी जगह पर रखें, सीधी धूप और नमी से बचाएं।'
        ],
        whatToAvoid: [
          'पड़ोसियों या रिश्तेदारों की बताई दवाइयां खुद खाना।',
          'बीपी, शुगर या दिल की दवाइयां खुद से बंद करना।'
        ]
      },
      medicationPearls: [
        'साल में एक बार अपनी सारी दवाइयां, सिरप और चूर्ण एक थैले में भरकर डॉक्टर को दिखाएं ताकि फालतू दवाएं बंद हो सकें।'
      ],
      redFlagEmergencySigns: [
        'काले रंग का लैट्रिन आना या उल्टी में काले दाने दिखना (दर्द की दवा से पेट में खून बहने का संकेत)।',
        'कोई नई गोली शुरू करने के 2 दिन के अंदर अचानक बहुत ज्यादा दिमागी भ्रम या बेहोशी होना।',
        'शरीर पर तेज लाल चकत्ते पड़ना या चेहरे पर सूजन आना।'
      ],
      dailyChecklist: [
        'दवाई बॉक्स के सही खाने से दवा निकाली और खाई',
        'सीधे बैठकर पूरे गिलास पानी के साथ दवा ली',
        'दवा खत्म होने से 5 दिन पहले नई दवा मंगवा ली',
        'संजीवनी ऐप में दवा का समय नोट किया'
      ],
      evidenceSource: 'अमेरिकन जेरियाट्रिक्स सोसाइटी (AGS) बीयर्स क्राइटेरिया 2023'
    },
    mr: {
      title: 'औषधांची सुरक्षितता आणि घातक गोळ्यांपासून सावधगिरी',
      subtitle: 'औषधांचे योग्य नियोजन आणि डॉक्टरांच्या सल्ल्याशिवाय पेनकिलर घेण्याचे धोके.',
      overview: 'वय वाढल्यामुळे शरीराची औषधे पचवण्याची क्षमता मंदावते. अनेक गोळ्या एकाच वेळी घेतल्यास पोटात अल्सर, चक्कर येणे आणि गोंधळ उडणे असे दुष्परिणाम होऊ शकतात.',
      whyItMatters: 'साध्या दिसणाऱ्या वेदनाशामक गोळ्या (पेनकिलर) आणि झोपेची कफ सिरप्स ज्येष्ठांच्या किडनीला आणि मेंदूला धोका पोहोचवू शकतात.',
      actionableSteps: [
        {
          title: 'डॉक्टरांच्या सल्ल्याशिवाय टाळावयाची औषधे',
          description: 'ज्येष्ठांसाठी घातक ठरू शकणारी औषधे:',
          tips: [
            'कडक पेनकिलर (ब्रुफेन, डिक्लोफेनॅक, कॉम्बिफ्लॅम): यामुळे पोटात अल्सर, रक्तस्राव आणि किडनीला इजा होऊ शकते. फक्त साधे पॅरासिटामॉल वापरा.',
            'झोपेची कफ सिरप्स: यामुळे लघवी अडकणे, चक्कर येणे आणि रात्री पडणे होऊ शकते.',
            'झोपेच्या गोळ्या: यामुळे दुसऱ्या दिवशी गुंगी राहून पडण्याचा धोका वाढतो.'
          ]
        },
        {
          title: '७ दिवसांचा औषधांचा डबा (पिल बॉक्स) वापरा',
          description: 'औषध विसरणे किंवा दुप्पट खाणे टाळण्यासाठी:',
          tips: [
            'आठवड्यातून एकदा शांत बसून सकाळ/दुपार/रात्र या कप्प्यांमध्ये ७ दिवसांची औषधे भरा.',
            'गोळ्या डॉक्टरांना विचारल्याशिवाय कुस्करून किंवा बारीक करून देऊ नका.',
            'गोळी घेताना नेहमी ताठ बसून पूर्ण १ ग्लास पाण्यासोबत घ्या.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'गोळी घेतल्यानंतर १५-२० मिनिटे ताठ बसा जेणेकरून अन्ननलिकेत गोळी अडकणार नाही.',
          'औषधे कोरड्या, थंड ठिकाणी ठेवा.'
        ],
        whatToAvoid: [
          'दुसऱ्यांची औषधे स्वतः घेणे.',
          'बीपी, मधुमेह किंवा हृदयाची औषधे परस्पर बंद करणे.'
        ]
      },
      medicationPearls: [
        'वर्षातून एकदा सर्व औषधे, सिरप्स आणि आयुर्वेदिक औषधे पिशवीत भरून डॉक्टरांना दाखवा जेणेकरून नको असलेली औषधे बंद करता येतील.'
      ],
      redFlagEmergencySigns: [
        'काळ्या रंगाची संडास होणे (पोटात अंतर्गत रक्तस्राव झाल्याचे लक्षण).',
        'नवीन गोळी सुरू केल्यावर १-२ दिवसांत अचानक अतीव गोंधळ किंवा गुंगी येणे.',
        'अंगावर अ‍ॅलर्जीचे लाल चट्टे उठणे किंवा ओठ/चेहरा सुजणे.'
      ],
      dailyChecklist: [
        'योग्य वेळेच्या कप्प्यातून गोळी घेतली',
        'ताठ बसून पूर्ण पाण्यासोबत गोळी घेतली',
        'औषध संपण्यापूर्वी ५ दिवस आधी नवीन आणून ठेवले',
        'संजीवनी अ‍ॅपवर औषध घेतल्याची नोंद केली'
      ],
      evidenceSource: 'AGS बीयर्स क्रायटेरिया २०२३ आणि औषध सुरक्षा मार्गदर्शक तत्त्वे'
    }
  },
  {
    id: 'bed-bound-wound-care',
    category: 'Bedside Nursing',
    readingTimeMinutes: 5,
    en: {
      title: 'Bedside Care & Bedsore (Pressure Sore) Prevention',
      subtitle: 'The 2-hour turning rule, skin hygiene, and safe feeding without choking.',
      overview: 'For bed-bound or paralyzed elders, careful home nursing prevents dangerous bedsores, lung infections, and skin tears. Regular turning is the most important medicine.',
      whyItMatters: 'A bedsore can develop in just 2 hours of resting in one position on the tailbone or heels. Once formed, bedsores take months to heal.',
      actionableSteps: [
        {
          title: 'The 2-Hour Turning Clock',
          description: 'Change position every 2 hours throughout day and night:',
          tips: [
            'Rotate: Back -> Tilt to Left Side (30 degrees) -> Tilt to Right Side (30 degrees).',
            'Use pillows along the back to tilt gently. Never lay the person flat on their hip bone.',
            'Float the Heels: Place a soft pillow under the calves so heels do not rub on the bedsheet.'
          ]
        },
        {
          title: 'Safe Feeding (Prevent Choking & Pneumonia)',
          description: 'Food or water must never go into the lungs:',
          tips: [
            'Always sit the person straight upright at 90 degrees during all food and drinks.',
            'Give small spoonfuls slowly; ensure each swallow is complete before giving the next.',
            'Keep them sitting upright for at least 30 minutes after eating.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'High protein food helps skin heal: paneer, boiled egg white, sattu drink, moong dal soup, curd.',
          'Keep bedsheets completely clean, dry, and wrinkle-free.'
        ],
        whatToAvoid: [
          'Rubbing or vigorously massaging red skin over tailbone or hips (massaging fragile skin breaks deep vessels).',
          'Using hard rubber donut rings.'
        ]
      },
      medicationPearls: [
        'Apply zinc oxide barrier cream after cleaning toilet areas to protect skin from moisture.'
      ],
      redFlagEmergencySigns: [
        'Skin over tailbone or heel turns dark purple, black, or develops an open smelly sore with pus.',
        'Fever with chills and chest rattling sounds after eating (aspiration lung infection).'
      ],
      dailyChecklist: [
        'Turned side every 2 hours logged on companion clock',
        'Morning skin check of tailbone and heels done',
        'Air mattress checked working',
        'Sat upright for 30 minutes after every meal'
      ],
      evidenceSource: 'EPUAP/NPIAP International Pressure Sore Guidelines'
    },
    hi: {
      title: 'बिस्तर पर लेटे मरीज की देखभाल और बेडसोर से बचाव',
      subtitle: 'हर 2 घंटे में करवट बदलने का नियम, त्वचा की सफाई और बिना फंदे के खाना खिलाना।',
      overview: 'बिस्तर पर लेटे बुजुर्गों में सबसे बड़ा खतरा पीठ के निचले हिस्से (कमर/कूल्हे) और एड़ी पर घाव (बेडसोर) बनने का होता है। सही देखभाल से इन घावों को 100% रोका जा सकता है।',
      whyItMatters: 'अगर मरीज 2 घंटे से ज्यादा एक ही करवट लेटा रहे, तो खून का दौरा रुकने से गहरा घाव बन सकता है। नियमित करवट बदलना ही सबसे बड़ी दवा है।',
      actionableSteps: [
        {
          title: 'हर 2 घंटे में करवट बदलने की घड़ी (Q2H नियम)',
          description: 'दिन-रात हर 2 घंटे में मरीज की स्थिति बदलें:',
          tips: [
            'क्रम: सीधा लेटना -> बाईं तरफ हल्का तिरछा (30 डिग्री) -> दाईं तरफ हल्का तिरछा।',
            'पीठ के पीछे तकिया लगाकर 30 डिग्री तिरछा करें; सीधे कूल्हे की हड्डी पर न लिटाएं।',
            'एड़ी को चादर से ऊपर रखें: पिंडलियों के नीचे पतला तकिया लगाएं ताकि एड़ी चादर पर न रगड़े।'
          ]
        },
        {
          title: 'खाना खिलाने का सुरक्षित तरीका (फंदा लगने और फेफड़े में जाने से बचाव)',
          description: 'खाना या पानी फेफड़ों में जाने से निमोनिया हो सकता है:',
          tips: [
            'खाना या दवाई देते समय मरीज को बिस्तर पर 90 डिग्री बिल्कुल सीधा बैठाएं।',
            'छोटे-छोटे चम्मच से धीरे-धीरे खिलाएं; एक घूंट निगलने के बाद ही दूसरा दें।',
            'खाना खाने के बाद कम से कम 30 मिनट तक सीधा बैठाए रखें, तुरंत न लिटाएं।'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'त्वचा को मजबूत रखने के लिए प्रोटीन दें: सत्तू, पनीर, उबले अंडे का सफेद भाग, मूंग दाल सूप, दही।',
          'बिस्तर की चादर बिल्कुल साफ, सूखी और बिना सिलवट की रखें।'
        ],
        whatToAvoid: [
          'कमर या कूल्हे की लाल पड़ी त्वचा पर जोर-जोर से मालिश करना (मालिश से अंदरूनी नसें फट जाती हैं)।',
          'रबर के गोल रिंग का इस्तेमाल करना।'
        ]
      },
      medicationPearls: [
        'पेशाब/शौच साफ करने के बाद जिंक ऑक्साइड वाली क्रीम लगाएं ताकि गीलेपन से त्वचा न छिले।'
      ],
      redFlagEmergencySigns: [
        'कमर, कूल्हे या एड़ी की चमड़ी काली पड़ जाना या मवाद भरा खुला घाव बन जाना।',
        'खाना खाने के बाद तेज बुखार, ठंड लगना और छाती में घरघराहट होना (फेफड़े में खाना जाने का खतरा)।'
      ],
      dailyChecklist: [
        'हर 2 घंटे में करवट बदली और संजीवनी में नोट किया',
        'सुबह कमर और एड़ी की त्वचा की जांच की',
        'एयर गद्दा चालू और ठीक है',
        'खाने के बाद 30 मिनट सीधा बैठाया'
      ],
      evidenceSource: 'अंतरराष्ट्रीय प्रेशर अल्सर गाइडलाइन्स (EPUAP/NPIAP)'
    },
    mr: {
      title: 'अंथरुणाला खिळलेल्या रुग्णाची काळजी आणि बेड्सोरपासून बचाव',
      subtitle: 'दर २ तासांनी कूस बदलणे, त्वचेची स्वच्छता आणि ठसका न लागता भरवणे.',
      overview: 'अंथरुणावर झोपून असलेल्या ज्येष्ठ रुग्णांमध्ये पाठीवर, माकडहाडावर आणि टाचांवर जखमा (बेडसोर) होण्याचा मोठा धोका असतो. नियमित कूस बदलून हे पूर्णपणे रोखता येते.',
      whyItMatters: 'एकाच स्थितीत २ तास पडून राहिल्याने त्वचेचा रक्तपुरवठा खंडित होतो आणि खोल जखम होते. कूस बदलणे हीच सर्वात मोठी काळजी आहे.',
      actionableSteps: [
        {
          title: 'दर २ तासांनी कूस बदलण्याचे घड्याळ',
          description: 'दिवस-रात्र दर २ तासांनी रुग्णाची स्थिती बदला:',
          tips: [
            'क्रम: पाठीवर सरळ -> डाव्या कुशीवर ३० अंश तिरपे -> उजव्या कुशीवर ३० अंश तिरपे.',
            'पाठीमागे उशी लावून तिरपे करा; थेट खुब्याच्या हाडावर झोपवू नका.',
            'टाचा वर ठेवा: पोटऱ्यांखाली उशी ठेवा जेणेकरून टाचा चादरीला घासला जाणार नाहीत.'
          ]
        },
        {
          title: 'अन्न आणि पाणी भरवण्याची सुरक्षित पद्धत (ठसका टाळणे)',
          description: 'अन्न किंवा पाणी श्वासनलिकेत गेल्यास न्युमोनिया होऊ शकतो:',
          tips: [
            'जेवताना किंवा औषध घेताना रुग्णाला खाटेवर ९० अंश पूर्ण सरळ बसवा.',
            'छोट्या चमच्याने हळूहळू भरवा; गिळल्याची खात्री झाल्यावरच पुढचा घास द्या.',
            'जेवण झाल्यावर किमान ३० मिनिटे सरळ बसवून ठेवा, लगेच झोपवू नका.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'त्वचेच्या आरोग्यासाठी प्रथिनेयुक्त आहार द्या: मूग डाळीचे सूप, पनीर, उकडलेले अंडे, दही.',
          'अंथरुणाची चादर स्वच्छ, कोरडी आणि सुरकुत्या नसलेली ठेवा.'
        ],
        whatToAvoid: [
          'लाल पडलेल्या त्वचेवर किंवा हाडांवर जोराने मसाज करणे (याने नाजूक पेशी फुटतात).',
          'रबरी गोल रिंगचा वापर करणे.'
        ]
      },
      medicationPearls: [
        'शौचास स्वच्छ केल्यानंतर त्वचेवर झिंक ऑक्साइड क्रीम लावा जेणेकरून ओलाव्यामुळे त्वचा सोलणार नाही.'
      ],
      redFlagEmergencySigns: [
        'माकडहाडावर किंवा टाचेवर काळा डाग पडणे किंवा पू असलेली जखम दिसणे.',
        'जेवल्यानंतर अचानक ताप भरणे आणि छातीत घरघर आवाज होणे.'
      ],
      dailyChecklist: [
        'दर २ तासांनी कूस बदलली',
        'सकाळी पाठीच्या आणि टाचांच्या त्वचेची तपासणी केली',
        'एअर मॅट्रेस व्यवस्थित चालू आहे',
        'जेवणानंतर ३० मिनिटे सरळ बसवले'
      ],
      evidenceSource: 'आंतरराष्ट्रीय प्रेशर अल्सर मार्गदर्शक तत्त्वे (EPUAP/NPIAP)'
    }
  },
  {
    id: 'geriatric-nutrition-sarcopenia',
    category: 'Nutrition & Sarcopenia',
    readingTimeMinutes: 4,
    en: {
      title: 'Senior Nutrition, Water & Muscle Strength',
      subtitle: 'Easy high-protein Indian foods, staying hydrated, and keeping muscles strong.',
      overview: 'With age, appetite and thirst naturally decrease, and muscles can become weak (sarcopenia). Eating the right soft, protein-rich foods keeps elders strong and energetic.',
      whyItMatters: 'Unplanned weight loss of even 2-3 kg makes seniors weak, unsteady on their feet, and prone to illness.',
      actionableSteps: [
        {
          title: 'Easy Ways to Add Protein in Indian Meals',
          description: 'Seniors need protein with every meal to keep leg muscles strong:',
          tips: [
            'Add sattu (roasted chana powder) or milk powder to dal, soup, and porridge.',
            'Include soft paneer, curd/buttermilk, moong dal khichdi, boiled egg whites, and soft idlis.',
            'Offer 4 to 5 small meals throughout the day instead of 2 heavy meals.'
          ]
        },
        {
          title: 'Daily Water & Fluid Goal',
          description: 'Seniors often do not feel thirsty even when dehydrated:',
          tips: [
            'Aim for 6 to 8 glasses of fluid every day (water, spiced buttermilk/chaas, lemon water, clear dal soup).',
            'Give most fluids during morning and afternoon; reduce after 7 PM so night sleep is not disturbed by toilet trips.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'Make food soft and easy to chew: khichdi, daliya, soft steamed idli, vegetable soup with crushed paneer.',
          'Do 10 minutes of gentle leg-lifting exercises to turn food into muscle strength.'
        ],
        whatToAvoid: [
          'Very oily, deep-fried foods that cause acidity and stomach heaviness.',
          'Skipping water because of fear of going to the toilet.'
        ]
      },
      medicationPearls: [
        'Check dentures regularly; loose dentures make elders stop chewing healthy solid foods.'
      ],
      redFlagEmergencySigns: [
        'Losing 3 kg or more in a single month without trying.',
        'Signs of severe dehydration: very dry mouth, sunken eyes, not passing urine for 8+ hours.'
      ],
      dailyChecklist: [
        'At least 2 protein items (dal/paneer/egg/curd) eaten today',
        '6 glasses of water/liquids drunk during the day',
        'Body weight checked and noted once a week',
        'Dentures cleaned and checked comfortable'
      ],
      evidenceSource: 'ICMR Indian Dietary Guidelines for Older Adults'
    },
    hi: {
      title: 'बुजुर्गों का खान-पान, पानी और मांसपेशियों की ताकत',
      subtitle: 'आसानी से पचने वाले प्रोटीन आहार, पर्याप्त पानी और कमजोरी दूर करने के उपाय।',
      overview: 'उम्र बढ़ने पर भूख और प्यास कम लगने लगती है और हाथ-पैरों की मांसपेशियां कमजोर (सार्कोपीनिया) होने लगती हैं। सही और पौष्टिक खान-पान से कमजोरी और थकान दूर रहती है।',
      whyItMatters: 'अगर बुजुर्ग का वजन बिना किसी कारण 2-3 किलो भी गिर जाए, तो वे बहुत कमजोर हो जाते हैं और उनके गिरने का खतरा बढ़ जाता है।',
      actionableSteps: [
        {
          title: 'भारतीय भोजन में प्रोटीन बढ़ाने के आसान उपाय',
          description: 'पैरों और शरीर की ताकत के लिए हर खाने में प्रोटीन जरूरी है:',
          tips: [
            'दाल, सूप या दलिया में सत्तू (भुना चना पाउडर) या दूध पाउडर मिलाएं।',
            'मुलायम पनीर, गाढ़ी दही/छाछ, मूंग दाल की खिचड़ी, उबले अंडे की सफेदी और इडली खिलाएं।',
            'दो भारी थाली की जगह दिनभर में 4-5 बार थोड़ा-थोड़ा हल्का पौष्टिक भोजन दें।'
          ]
        },
        {
          title: 'दिनभर में पर्याप्त पानी पीने का नियम',
          description: 'बुजुर्गों को प्यास का अहसास कम होता है, इसलिए उन्हें याद दिलाकर पानी पिलाएं:',
          tips: [
            'दिनभर में 6 से 7 गिलास तरल पदार्थ (पानी, जीरा छाछ, नींबू पानी, दाल का पानी, नारियल पानी) पिलाएं।',
            'ज्यादातर पानी सुबह और दोपहर में पिलाएं; शाम 7 बजे के बाद कम दें ताकि रात में बार-बार पेशाब के लिए न उठना पड़े।'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'दांतों की सुविधा के हिसाब से खाना नरम बनाएं: खिचड़ी, वेज दलिया, दाल-चावल, मसली हुई सब्जियां।',
          'खाना पचने और ताकत बनने के लिए कुर्सी पर बैठकर 10 मिनट पैर हिलाने की हल्की कसरत करें।'
        ],
        whatToAvoid: [
          'बहुत ज्यादा तला-भुना और मसालेदार खाना जिससे गैस और भारीपन हो।',
          'बार-बार पेशाब जाने के डर से पानी पीना बंद कर देना।'
        ]
      },
      medicationPearls: [
        'नकली बत्तीसी (डेंचर) की रोज जांच करें; ढीले दांतों की वजह से बुजुर्ग खाना चबाना छोड़ देते हैं।'
      ],
      redFlagEmergencySigns: [
        'एक महीने के अंदर 2-3 किलो से ज्यादा वजन अपने आप घट जाना।',
        'गंभीर डिहाइड्रेशन के लक्षण: होंठ और जीभ बिल्कुल सूख जाना, 8 घंटे तक पेशाब न आना।'
      ],
      dailyChecklist: [
        'आज के खाने में दाल/पनीर/अंडा/दही शामिल किया',
        'दिनभर में 6 गिलास पानी/छाछ पिलाई',
        'हफ्ते में एक बार सुबह वजन नापा',
        'दांतों की सफाई की और आराम देखा'
      ],
      evidenceSource: 'ICMR भारतीय वरिष्ठ नागरिक पोषण दिशानिर्देश'
    },
    mr: {
      title: 'ज्येष्ठांचे पोषण, पाणी आणि स्नायूंची ताकद',
      subtitle: 'सहज पचणारा प्रथिनयुक्त आहार, पाण्याचे प्रमाण आणि अशक्तपणा दूर करणे.',
      overview: 'वय वाढल्यामुळे भूक आणि तहान कमी होते आणि स्नायू अशक्त (सार्कोपेनिया) होऊ लागतात. योग्य व मऊ प्रथिनयुक्त आहारामुळे ताकद आणि ऊर्जा टिकून राहते.',
      whyItMatters: 'कारण नसताना २-३ किलो वजन कमी झाल्यास ज्येष्ठ नागरिक खूप अशक्त होतात आणि त्यांचा तोल जाण्याची भीती असते.',
      actionableSteps: [
        {
          title: 'घरगुती आहारात प्रथिने (प्रोटीन) वाढवण्याचे सोपे मार्ग',
          description: 'स्नायू बळकट ठेवण्यासाठी प्रत्येक जेवणात प्रथिने आवश्यक आहेत:',
          tips: [
            'वरण, सूप किंवा लापशीमध्ये भाजलेल्या हरभऱ्याचे पीठ (सत्तू) घाला.',
            'मऊ पनीर, ताक, दही, मुगाची मऊ खिचडी, उकडलेल्या अंड्याचा पांढरा भाग खाऊ घाला.',
            'दोन वेळच्या जड जेवणाऐवजी दिवसातून ४ ते ५ वेळा थोडे थोडे हलके जेवण द्या.'
          ]
        },
        {
          title: 'दिवसभरातील पाण्याचे योग्य प्रमाण',
          description: 'ज्येष्ठांना तहान लागत नाही, त्यामुळे त्यांना आठवण करून पाणी द्यावे लागते:',
          tips: [
            'दिवसभरात ६ ते ८ ग्लास पातळ पदार्थ (पाणी, ताक, लिंबू पाणी, डाळीचे पाणी, सूप) द्या.',
            'जास्त पाणी सकाळी आणि दुपारी द्या; रात्री ७ नंतर प्रमाण कमी करा जेणेकरून रात्री लघवीसाठी झोपमोड होणार नाही.'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'दात नसतील तर मऊ अन्न बनवा: मऊ खिचडी, दलिया, मऊ इडली, बारीक केलेल्या भाज्या.',
          'ताकदीसाठी खुर्चीवर बसून १० मिनिटे पायांचे हलके व्यायाम करा.'
        ],
        whatToAvoid: [
          'अति तेलकट, तूपकट अन्न ज्यामुळे अपचन होते.',
          'लघवीला जावे लागेल या भीतीने पाणी पिणे टाळणे.'
        ]
      },
      medicationPearls: [
        'दातांची कवळी व्यवस्थित बसते का ते तपासा; कवळी सैल असल्यास ज्येष्ठ जेवणे कमी करतात.'
      ],
      redFlagEmergencySigns: [
        'एका महिन्यात विनाकारण २-३ किलो वजन घटणे.',
        'शरीरातील पाणी अतिशय कमी होण्याची लक्षणे: कोरडी जीभ, ८ तासांपेक्षा जास्त वेळ लघवी न होणे.'
      ],
      dailyChecklist: [
        'आहारात डाळ/पनीर/अंडे/ताक दिले',
        'दिवसभरात ६ ग्लास पाणी/पातळ पदार्थ दिले',
        'आठवड्यातून एकदा वजन तपासले',
        'दातांची कवळी स्वच्छ केली'
      ],
      evidenceSource: 'ICMR ज्येष्ठ नागरिक आहार व पोषण मार्गदर्शक तत्त्वे'
    }
  },
  {
    id: 'delirium-emergency-action',
    category: 'Emergency & Delirium',
    readingTimeMinutes: 4,
    en: {
      title: 'Sudden Confusion (Delirium): A Medical Emergency',
      subtitle: 'Recognizing sudden mental changes, finding the cause, and getting help quickly.',
      overview: 'If an elderly person suddenly becomes confused, sees imaginary things, or becomes unusually sleepy over a few hours or days, this is DELIRIUM—a medical emergency that needs immediate medical care.',
      whyItMatters: 'Delirium is NOT just old age or dementia. It is usually caused by an easily treatable body infection (urine infection, lung congestion), constipation, or a new medicine.',
      actionableSteps: [
        {
          title: 'Difference: Delirium vs Dementia',
          description: 'Know the difference quickly:',
          tips: [
            'DELIRIUM: Starts SUDDENLY in hours/days; attention changes wildly; elder can see hallucinations. MEDICAL EMERGENCY.',
            'DEMENTIA: Starts SLOWLY over months/years; memory loss is gradual; attention is steady in early stages.'
          ]
        },
        {
          title: 'Immediate Home Checklist (Look for Hidden Triggers)',
          description: 'Check these 5 things right away:',
          tips: [
            'Urine: Is there bad-smelling urine, fever, or pain while passing urine?',
            'Stomach: Has the elder missed bowel movements for 3 or more days?',
            'Oxygen & Sugar: Check oxygen on pulse oximeter (should be > 94%) and blood sugar with glucometer.',
            'Medicines: Was any new medicine, painkiller, or cold syrup started in the last 5 days?'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'Keep the room well-lit with a large wall clock and familiar family photos.',
          'Ensure eyeglasses are clean and on their face, and hearing aids are switched on.',
          'Have one familiar family member sit near the bed and speak in a calm, reassuring voice.'
        ],
        whatToAvoid: [
          'Tying down or physically holding an agitated patient (this increases panic and fear).',
          'Giving sleeping pills without doctor permission.'
        ]
      },
      medicationPearls: [
        'Never give sedatives to quiet down a confused senior without immediate emergency doctor guidance.'
      ],
      redFlagEmergencySigns: [
        'Sudden severe confusion with high fever, chills, or oxygen dropping below 92%.',
        'Person cannot stay awake or is impossible to wake up.',
        'Extreme agitation or danger of falling and hurting themselves.'
      ],
      dailyChecklist: [
        'Mental alertness and memory baseline checked in the morning',
        'Temperature, oxygen, and blood pressure recorded',
        'Bowel movement and urine confirmed for the last 24h',
        'Calm family reassurance given'
      ],
      evidenceSource: 'British Geriatrics Society & NICE Delirium Protocol'
    },
    hi: {
      title: 'अचानक दिमागी भ्रम और बेचैनी (डेलिरियम): तुरंत ध्यान दें',
      subtitle: 'अचानक हुए मानसिक बदलाव को पहचानना, कारण ढूंढना और तुरंत मदद लेना।',
      overview: 'अगर कोई बुजुर्ग अचानक कुछ ही घंटों या 1-2 दिन में बहकी-बहकी बातें करने लगे, न दिखने वाली चीजें देखने लगे या बहुत ज्यादा सुस्त हो जाए, तो इसे डेलिरियम कहते हैं। यह एक मेडिकल इमरजेंसी है।',
      whyItMatters: 'यह बुढ़ापे का सामान्य असर नहीं है। अक्सर यह यूरिन इन्फेक्शन, पेट साफ न होने (कब्ज), ऑक्सीजन की कमी या किसी नई दवाई के साइड इफेक्ट से होता है और इलाज से पूरी तरह ठीक हो जाता है।',
      actionableSteps: [
        {
          title: 'डेलिरियम और डिमेंशिया में अंतर समझें',
          description: 'दोनों का फर्क तुरंत पहचानें:',
          tips: [
            'डेलिरियम: अचानक कुछ घंटों या दिनों में शुरू होता है; ध्यान भटकता रहता है; मरीज डर जाता है। यह तुरंत डॉक्टर को दिखाने वाली इमरजेंसी है।',
            'डिमेंशिया: महीनों और सालों में धीरे-धीरे बढ़ता है; भूलने की आदत धीरे-धीरे आती है।'
          ]
        },
        {
          title: 'घर पर तुरंत 5 चीजों की जांच करें',
          description: 'अचानक भ्रम होने पर ये कारण तुरंत देखें:',
          tips: [
            'पेशाब: क्या पेशाब में बदबू, जलन या बुखार है (यूरिन इन्फेक्शन का लक्षण)?',
            'पेट: क्या पिछले 3 दिनों से लैट्रिन नहीं हुई (गंभीर कब्ज)?',
            'ऑक्सीजन और शुगर: पल्स ऑक्सीमीटर से ऑक्सीजन (94% से ऊपर होनी चाहिए) और ग्लूकोमीटर से शुगर नापें।',
            'दवाएं: क्या पिछले 4-5 दिनों में कोई नई गोली या कफ सिरप शुरू किया गया था?'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'कमरे में अच्छी रोशनी रखें, दीवार पर बड़ी घड़ी और परिवार की फोटो लगाएं।',
          'बुजुर्ग का चश्मा और सुनने की मशीन (हियरिंग एड) जरूर लगवाएं ताकि उन्हें सब साफ दिखे और सुनाई दे।',
          'घर का कोई जाना-पहचाना सदस्य पास बैठकर शांत आवाज में भरोसा दिलाए।'
        ],
        whatToAvoid: [
          'घबराए मरीज के हाथ-पैर बांधना (इससे उनका डर और गुस्सा बढ़ जाता है)।',
          'बिना डॉक्टर से पूछे नींद की गोली देना।'
        ]
      },
      medicationPearls: [
        'डेलिरियम में बिना डॉक्टर की सलाह के कोई भी शांत करने वाली या नींद की गोली न दें।'
      ],
      redFlagEmergencySigns: [
        'अचानक भ्रम के साथ तेज बुखार, कंपकंपी या ऑक्सीजन का 92% से नीचे गिरना।',
        'मरीज का बिल्कुल न जाग पाना या बेसुध पड़े रहना (तुरंत अस्पताल ले जाएं)।'
      ],
      dailyChecklist: [
        'सुबह मरीज की मानसिक स्थिति और बातचीत का स्तर देखा',
        'बुखार, ऑक्सीजन और बीपी नापकर नोट किया',
        'पेशाब और पेट साफ होने की पुष्टि की',
        'प्यार से शांत और सुरक्षित माहौल दिया'
      ],
      evidenceSource: 'ब्रिटिश जेरियाट्रिक्स सोसाइटी और NICE डेलिरियम प्रोटोकॉल'
    },
    mr: {
      title: 'अचानक गोंधळणे आणि बेचैनी (डेलिरियम): तातडीने लक्ष द्या',
      subtitle: 'अचानक झालेल्या मानसिक बदलांची लक्षणे ओळखणे आणि तातडीने उपचार करणे.',
      overview: 'जर घरातील ज्येष्ठ व्यक्ती अचानक काही तासांत किंवा १-२ दिवसांत खूप गोंधळू लागली, अस्तित्वात नसलेल्या गोष्टी दिसू लागल्या किंवा अतिशय गुंगीत गेली, तर याला डेलिरियम म्हणतात. ही एक तातडीची वैद्यकीय आणीबाणी आहे.',
      whyItMatters: 'हा साधा म्हातारपणाचा परिणाम नाही. बऱ्याचदा लघवीतील इन्फेक्शन, पोट साफ न होणे (बद्धकोष्ठता), ऑक्सिजन कमी होणे किंवा नवीन औषधांमुळे हा त्रास होतो आणि वेळेवर उपचार केल्यास पूर्ण बरा होतो.',
      actionableSteps: [
        {
          title: 'डेलिरियम आणि डिमेंशिया यातील फरक ओळखा',
          description: 'फरक लगेच लक्षात घ्या:',
          tips: [
            'डेलिरियम: अचानक काही तासांत किंवा दिवसांत होतो; लक्ष स्थिर राहत नाही; व्यक्ती घाबरते. ही तातडीची आणीबाणी आहे.',
            'डिमेंशिया: महिने आणि वर्षांच्या कालावधीत हळूहळू वाढतो; विस्मरण हळूहळू होते.'
          ]
        },
        {
          title: 'घरी तातडीने ५ गोष्टी तपासा',
          description: 'अचानक गोंधळ उडाल्यास हे तपासा:',
          tips: [
            'लघवी: लघवीला दुर्गंधी, जळजळ किंवा ताप आहे का (इन्फेक्शनचे लक्षण)?',
            'पोट: मागील ३ दिवसांत पोट साफ झाले आहे का?',
            'ऑक्सिजन आणि साखर: पल्स ऑक्सिमीटरने ऑक्सिजन (९४% पेक्षा जास्त हवा) आणि ग्लुकोमीटरने साखर तपासा.',
            'औषधे: मागील ४-५ दिवसांत काही नवीन गोळी किंवा सिरप सुरू केले होते का?'
          ]
        }
      ],
      dietaryAndLifestyle: {
        recommendations: [
          'खोलीत चांगला प्रकाश ठेवा, भिंतीवर मोठे घड्याळ आणि कुटुंबाचे फोटो लावा.',
          'ज्येष्ठांचा चष्मा आणि ऐकण्याचे मशीन (हियरिंग एड) चालू करून लावा.',
          'कुटुंबातील ओळखीच्या व्यक्तीने जवळ बसून शांत आवाजात धीर द्यावा.'
        ],
        whatToAvoid: [
          'घाबरलेल्या रुग्णाला बांधून ठेवणे (यामुळे भीती आणि चिडचिड वाढते).',
          'डॉक्टरांच्या सल्ल्याशिवाय झोपेच्या गोळ्या देणे.'
        ]
      },
      medicationPearls: [
        'डेलिरियममध्ये डॉक्टरांना विचारल्याशिवाय कोणतीही गुंगी आणणारी औषधे देऊ नका.'
      ],
      redFlagEmergencySigns: [
        'अचानक गोंधळ आणि सोबत तीव्र ताप किंवा ऑक्सिजन ९२% च्या खाली जाणे.',
        'रुग्ण अजिबात शुद्धीत न येणे किंवा प्रतिसाद न देणे (लगेच १०८ वर फोन करा).'
      ],
      dailyChecklist: [
        'सकाळी रुग्णाची मानसिक स्थिती पाहिली',
        'ताप, ऑक्सिजन आणि बीपी तपासून नोंद केली',
        'लघवी आणि पोट साफ झाल्याची खात्री केली',
        'शांत आणि प्रेमळ वातावरण दिले'
      ],
      evidenceSource: 'ब्रिटिश जेरियाट्रिक्स सोसायटी आणि NICE डेलिरियम मार्गदर्शक तत्त्वे'
    }
  }
];
