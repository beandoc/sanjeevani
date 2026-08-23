export type Option = {
  text: string;
  isCorrect: boolean;
  feedback: string;
  recommendation: string;
};

export interface SimulationCase {
  title: string;
  patientProfile: string;
  scenario: string;
  condition: string;
  category: string;
  options: Option[];
}

export const simulationsData: Record<string, SimulationCase> = {
  'managing-a-fall': {
    title: 'Managing an Acute Fall at Home',
    patientProfile: 'Shri Rameshwaram (82 years, History of Severe Osteoporosis, on Blood Thinners)',
    scenario:
      'You enter the living room and find Shri Rameshwaram on the floor next to his recliner chair. He is conscious and alert but looks worried and wincing.',
    condition: 'High risk of occult hip fracture and internal bleeding due to anticoagulant medication.',
    category: 'Emergency & Safety',
    options: [
      {
        text: 'Immediately pull him up by the arms and assist him onto the sofa.',
        isCorrect: false,
        feedback:
          'Incorrect. Moving an osteoporotic patient immediately after a fall can severely displace non-displaced fractures or worsen internal hemorrhage.',
        recommendation:
          'Never rush to stand a fallen elder. Conduct a visual and tactile assessment on the floor first before any movement.'
      },
      {
        text: 'Perform a systematic check for head trauma, neck pain, external bleeding, or leg shortening/rotation before attempting movement.',
        isCorrect: true,
        feedback:
          'Correct! Careful triage prevents converting a hairline fracture into a displaced compound fracture and identifies anticoagulant-related hematomas.',
        recommendation:
          'Keep the patient warm and calm. If there is severe pain, limb deformity, or head impact, dial 112 / 14567 and do not mobilize.'
      },
      {
        text: 'Leave him unattended on the floor and go out of the house to find a neighbor.',
        isCorrect: false,
        feedback:
          'Incorrect. Leaving a frail, disoriented elder unattended exposes them to hypothermia, panic, and aspiration.',
        recommendation:
          'Stay with the patient, reassure them calmly, and call for family/emergency assistance using your phone.'
      },
      {
        text: 'Immediately give him a hot cup of tea and pain medication while he remains flat.',
        isCorrect: false,
        feedback:
          'Incorrect. Giving oral liquids/solids immediately after a traumatic fall poses an acute aspiration hazard if emergency anesthesia/surgery is required.',
        recommendation:
          'Keep patient NPO (nil per os) until a physician rules out internal surgical injury.'
      }
    ]
  },
  'medication-confusion': {
    title: 'Medication Confusion & Resistance',
    patientProfile: 'Shrimati Kamala Bai (76 years, Congestive Heart Failure & Mild Cognitive Impairment)',
    scenario:
      'Shrimati Kamala Bai insists she already swallowed her morning heart pills (Diuretic & Beta-blocker), but her 7-day pillbox still contains all morning tablets. She is becoming agitated when questioned.',
    condition: 'Skipping diuretics risks acute pulmonary edema; double-dosing risks severe bradycardia & hypotension.',
    category: 'Medication Safety',
    options: [
      {
        text: 'Argue firmly and show her the calendar to prove she is forgetting.',
        isCorrect: false,
        feedback:
          'Incorrect. Direct confrontation triggers catastrophic agitation and defensive withdrawal in patients with cognitive impairment.',
        recommendation:
          'Use validation and therapeutic diversion. Never turn medication administration into a power struggle.'
      },
      {
        text: 'Say: "I understand, Kamala-ji. Let\'s pause, check your blood pressure and pulse together, and verify our dosage chart."',
        isCorrect: true,
        feedback:
          'Correct! This acknowledges her dignity, avoids argument, and introduces an objective clinical check (vital signs) before administering.',
        recommendation:
          'Combine therapeutic de-escalation with objective vital checks. If doubt persists, contact the prescribing physician.'
      },
      {
        text: 'Hide the pills inside her sweet tea or dal without telling her.',
        isCorrect: false,
        feedback:
          'Incorrect. Sneaking crushed medicines can alter pharmacokinetics (e.g. extended-release tablets) and damages trust if discovered.',
        recommendation:
          'Never crush sustained-release tablets without clinical pharmacist verification.'
      },
      {
        text: 'Assume she must be right and discard the morning compartment.',
        isCorrect: false,
        feedback:
          'Incorrect. Skipping heart failure diuretics can lead to nocturnal breathlessness and emergency hospitalization.',
        recommendation:
          'Maintain a pill-tracker sheet signed off at the exact moment of ingestion.'
      }
    ]
  },
  'sudden-shortness-of-breath': {
    title: 'Sudden Shortness of Breath (Acute Dyspnea)',
    patientProfile: 'Shri Babulal (78 years, COPD and History of Ischaemic Heart Disease)',
    scenario:
      'While walking from the veranda to the dining area, Shri Babulal suddenly clutches his chest, breathing rapidly with audible wheezing and lips turning pale.',
    condition: 'Acute bronchospasm vs heart failure exacerbation vs pulmonary embolism.',
    category: 'Emergency & Safety',
    options: [
      {
        text: 'Instruct him to lie completely flat on his back on the bed.',
        isCorrect: false,
        feedback:
          'Incorrect. Orthopnea worsens in the supine position because abdominal organs press against the diaphragm, reducing lung capacity.',
        recommendation:
          'Always position breathless elders in high-Fowler\'s (upright sitting) with tripod arm support on a table.'
      },
      {
        text: 'Position him upright leaning forward (tripod position), administer prescribed bronchodilator spacer, check pulse oximeter, and call 112 if SpO2 < 90%.',
        isCorrect: true,
        feedback:
          'Correct! The tripod position expands lung volume, while prompt bronchodilator and oximetry provide rapid relief and triage data.',
        recommendation:
          'Encourage slow, pursed-lip breathing (breathe in through nose for 2 counts, blow out through pursed lips for 4 counts).'
      },
      {
        text: 'Tell him to take deep, rapid hyperventilation breaths.',
        isCorrect: false,
        feedback:
          'Incorrect. Rapid breathing causes air-trapping and respiratory muscle exhaustion in COPD.',
        recommendation:
          'Pursed-lip breathing slows the respiratory rate and prevents bronchiolar collapse.'
      },
      {
        text: 'Give him a glass of chilled water to drink quickly.',
        isCorrect: false,
        feedback:
          'Incorrect. Forcing fluids during acute respiratory distress causes fatal aspiration into the lungs.',
        recommendation:
          'Never administer oral liquids during respiratory distress.'
      }
    ]
  },
  'hypertension-dizziness': {
    title: 'Orthostatic Hypotension & Dizzy Spells',
    patientProfile: 'Shri Jagdish Chandra (84 years, Recently started on Antihypertensive medication)',
    scenario:
      'Shri Jagdish tells you that every morning when he stands up from the pooja mat or bed, the room spins and he feels like blacking out for 15 seconds.',
    condition: 'Postural blood pressure drop (Orthostatic Hypotension) causing transient cerebral hypoperfusion.',
    category: 'Clinical Care',
    options: [
      {
        text: 'Reassure him that morning dizziness is natural in old age and tell him to ignore it.',
        isCorrect: false,
        feedback:
          'Incorrect. Orthostatic hypotension is a major precursor for syncopal falls and femoral neck fractures in elderly patients.',
        recommendation:
          'Never normalize postural blackouts. Check lying vs standing BP and report to his treating physician.'
      },
      {
        text: 'Teach the "3-stage rising routine" (sit on bed edge for 2 mins, pump ankles, then stand) and check lying & standing BP.',
        isCorrect: true,
        feedback:
          'Correct! Staged mobilization activates the calf muscle pump and gives the autonomic nervous system time to vasoconstrict.',
        recommendation:
          'A drop of >20 mmHg systolic or >10 mmHg diastolic on standing defines orthostatic hypotension requiring dose adjustment.'
      },
      {
        text: 'Instruct him to stop taking all his blood pressure medicines immediately without doctor consultation.',
        isCorrect: false,
        feedback:
          'Incorrect. Abruptly discontinuing antihypertensives can trigger severe rebound hypertensive crises or strokes.',
        recommendation:
          'Medication adjustments must be titrated under physician guidance.'
      },
      {
        text: 'Have him drink 3 cups of strong black coffee each time he stands up.',
        isCorrect: false,
        feedback:
          'Incorrect. Excessive caffeine causes tachycardia, palpitations, and diuresis, which can worsen hypovolemia.',
        recommendation:
          'Ensure baseline hydration with oral fluids and electrolytes rather than excessive stimulants.'
      }
    ]
  },
  'polypharmacy-prescribing-cascade': {
    title: 'Recognizing a Prescribing Cascade',
    patientProfile: 'Shrimati Meenakshi (79 years, Taking 8 chronic prescription medicines)',
    scenario:
      'Shrimati Meenakshi was prescribed Amlodipine 10mg 3 weeks ago for hypertension. Today, her son notices both her ankles are swollen and wants to ask the doctor for a "water pill" (diuretic).',
    condition: 'Dihydropyridine calcium channel blocker vasodilation vs true systemic fluid overload.',
    category: 'Medication Safety',
    options: [
      {
        text: 'Immediately agree and demand a high-dose loop diuretic to drain the fluid.',
        isCorrect: false,
        feedback:
          'Incorrect. Adding a diuretic to treat a drug side effect is a classic prescribing cascade that introduces dehydration and electrolyte imbalance.',
        recommendation:
          'Always suspect the newest medication whenever a new physical symptom appears in a multimorbid elder.'
      },
      {
        text: 'Recognize that Amlodipine causes dependent capillary leakage (edema) and discuss drug substitution or dose reduction with the physician.',
        isCorrect: true,
        feedback:
          'Correct! Ankle edema from Amlodipine is precapillary vasodilation, not systemic fluid retention; switching to an ARB/ACEi or reducing dose often resolves it.',
        recommendation:
          'Prevent prescribing cascades by reviewing recently initiated drugs with the clinician.'
      },
      {
        text: 'Instruct her to stop drinking water throughout the day to dry up the swelling.',
        isCorrect: false,
        feedback:
          'Incorrect. Restricting water intake in geriatric patients causes prerenal acute kidney injury and delirium.',
        recommendation:
          'Maintain adequate hydration while addressing the pharmacological root cause.'
      },
      {
        text: 'Wrap her ankles tightly with non-elastic duct tape.',
        isCorrect: false,
        feedback:
          'Incorrect. Inappropriate tight taping can cause skin breakdown, venous necrosis, and ulceration.',
        recommendation:
          'Use prescribed graded compression stockings only after ruling out severe peripheral arterial disease.'
      }
    ]
  },
  'recognizing-delirium': {
    title: 'Acute Delirium vs Dementia Progression',
    patientProfile: 'Shrimati Shakuntala (81 years, Mild Memory Loss, Started OTC sleep pill 2 days ago)',
    scenario:
      'Her family calls in panic: Shrimati Shakuntala, who was pleasant yesterday, became acutely agitated overnight, seeing insects on the ceiling and not recognizing her grandson.',
    condition: 'Acute Delirium triggered by anticholinergic drug toxicity (Diphenhydramine sleep aid) vs infection.',
    category: 'Clinical Care',
    options: [
      {
        text: 'Tell the family she has reached the final stage of Alzheimer’s and nothing can be done.',
        isCorrect: false,
        feedback:
          'Incorrect. Dementia progresses over years, whereas delirium occurs acutely over hours to days and is often fully reversible.',
        recommendation:
          'Acute confusion is a medical emergency. Investigate the "PINCHES" mnemonic (Pain, Infection, Nutrition, Constipation, Hydration, Electrolytes, Sedatives).'
      },
      {
        text: 'Identify acute fluctuating delirium, check for new OTC anticholinergic medicines / fever / UTI, and arrange urgent clinical evaluation.',
        isCorrect: true,
        feedback:
          'Correct! OTC sleep aids contain strong anticholinergic blockers that frequently precipitate acute delirium in vulnerable brains.',
        recommendation:
          'Stop the offending drug immediately under medical advice and provide a calm, well-lit, reorienting environment.'
      },
      {
        text: 'Give her another dose of the sleep syrup to knock her out until morning.',
        isCorrect: false,
        feedback:
          'Incorrect. Giving more anticholinergic sedatives will intensify delirium into stupor or respiratory depression.',
        recommendation:
          'Never treat drug-induced agitation with additional offending sedatives.'
      },
      {
        text: 'Tie her hands to the bedposts to stop her from pointing at the ceiling.',
        isCorrect: false,
        feedback:
          'Incorrect. Physical restraints heighten fear, agitation, tachycardia, and strangulation risks in delirious patients.',
        recommendation:
          'Use calm de-escalation, familiar family voices, and gentle 1-on-1 observation.'
      }
    ]
  },
  'post-stroke-dysphagia': {
    title: 'Post-Stroke Aspiration & Dysphagia Protocol',
    patientProfile: 'Shrimati Suniti (74 years, 3 Months Post-Ischemic Stroke with Left Hemiparesis)',
    scenario:
      'While feeding Shrimati Suniti her afternoon ragi porridge, she coughs weakly, her eyes water, and her voice sounds gurgly and wet after swallowing.',
    condition: 'Silent or overt pharyngeal dysphagia with high risk of aspiration pneumonia.',
    category: 'Practical Nursing',
    options: [
      {
        text: 'Quickly give her a large glass of thin water to wash down the porridge.',
        isCorrect: false,
        feedback:
          'Incorrect. Thin liquids flow too rapidly into an unprotected airway and are the most common cause of fatal aspiration pneumonia in stroke patients.',
        recommendation:
          'Never wash down choking food with thin liquids. Stop feeding immediately.'
      },
      {
        text: 'Stop feeding immediately, sit her at 90 degrees with chin-tuck posture, encourage coughing, and request a swallowing assessment.',
        isCorrect: true,
        feedback:
          'Correct! The chin-tuck posture widens the valleculae and closes the airway entrance during swallowing.',
        recommendation:
          'A "wet, gurgly voice" indicates food resting on the vocal cords. Maintain oral suction readiness and use recommended thickened consistencies.'
      },
      {
        text: 'Have her tilt her head backward looking at the ceiling while swallowing.',
        isCorrect: false,
        feedback:
          'Incorrect. Tilting the head back opens the trachea directly to the esophagus and forces food into the lungs.',
        recommendation:
          'Always use the chin-down (chin-tuck) posture for neurogenic dysphagia.'
      },
      {
        text: 'Force her to lie down flat to catch her breath.',
        isCorrect: false,
        feedback:
          'Incorrect. Lying flat facilitates gravity-induced entry of food boluses into the bronchial tree.',
        recommendation:
          'Keep the patient upright for at least 30 to 45 minutes after every meal.'
      }
    ]
  },
  'sundowning-agitation': {
    title: 'Nocturnal Agitation & Sundowning Management',
    patientProfile: 'Shri Ganpatrao (80 years, Moderate Alzheimer\'s Disease)',
    scenario:
      'At 6:30 PM as dusk falls, Shri Ganpatrao becomes intensely restless, packs his clothes in a bag, and repeatedly tries to unlock the main door shouting that he must "catch the train to his ancestral village".',
    condition: 'Sundowning syndrome driven by circadian disruption, twilight shadows, and sensory fatigue.',
    category: 'Dementia Care',
    options: [
      {
        text: 'Physically block the door, shout that his village home was sold 30 years ago, and force him to his bedroom.',
        isCorrect: false,
        feedback:
          'Incorrect. Confronting dementia patients with harsh reality triggers panic, aggressive resistance, and catastrophic reactions.',
        recommendation:
          'Step into their emotional reality. Validate their longing for safety rather than arguing about factual history.'
      },
      {
        text: 'Turn on warm ambient lighting before sunset, close curtains to prevent reflection shadows, validate his feelings ("You miss home"), and redirect with a comforting warm beverage and nostalgic music.',
        isCorrect: true,
        feedback:
          'Correct! Proactive environmental lighting eliminates twilight shadows, while validation and sensory soothing diffuse nocturnal anxiety.',
        recommendation:
          'Maintain daytime light exposure and establish a predictable, peaceful evening calming routine.'
      },
      {
        text: 'Lock him in his bedroom from the outside until breakfast.',
        isCorrect: false,
        feedback:
          'Incorrect. Confinement causes terror, door-banging injuries, and extreme psychological distress.',
        recommendation:
          'Ensure home perimeter safety with disguised door murals or gentle chime alerts while maintaining free indoor movement.'
      },
      {
        text: 'Give him strong caffeine to keep him sharp through the evening.',
        isCorrect: false,
        feedback:
          'Incorrect. Evening stimulants worsen circadian disruption and insomnia.',
        recommendation:
          'Avoid caffeine after 2:00 PM.'
      }
    ]
  },
  'hypoglycemia-triage': {
    title: 'Diabetic Hypoglycemia Emergency at Home',
    patientProfile: 'Shri Harishchandra (75 years, Type 2 Diabetes on Glimepiride and Insulin)',
    scenario:
      'Shri Harishchandra is sitting on the dining chair, profusely sweating with trembling hands, pale skin, and slurred speech. His glucometer reads 52 mg/dL.',
    condition: 'Neuroglycopenic hypoglycemia (blood glucose < 70 mg/dL).',
    category: 'Emergency & Safety',
    options: [
      {
        text: 'Immediately administer another dose of insulin to calm his shaking.',
        isCorrect: false,
        feedback:
          'Incorrect. Giving insulin during hypoglycemia can cause irreversible brain damage, seizures, or death.',
        recommendation:
          'Never administer insulin without checking blood sugar and confirming hyperglycemia.'
      },
      {
        text: 'Apply the "Rule of 15": Administer 15g fast-acting sugar (3 tsp glucose powder in water or half cup fruit juice), recheck glucose in 15 minutes.',
        isCorrect: true,
        feedback:
          'Correct! 15 grams of simple fast-acting carbohydrates raises blood glucose rapidly without overshooting.',
        recommendation:
          'Once glucose rises above 70 mg/dL, provide a complex carbohydrate snack (roti or biscuit) to prevent delayed re-hypoglycemia.'
      },
      {
        text: 'Give him a large bowl of high-fat butter or cheese.',
        isCorrect: false,
        feedback:
          'Incorrect. Dietary fat delays gastric emptying and slows glucose absorption during acute hypoglycemia.',
        recommendation:
          'Use pure simple sugars (glucose powder, honey, juice) rather than high-fat sweets.'
      },
      {
        text: 'Tell him to go to sleep and check his sugar the next morning.',
        isCorrect: false,
        feedback:
          'Incorrect. Severe untreated hypoglycemia during sleep can lead to hypoglycemic coma and death.',
        recommendation:
          'Treat and recheck until blood sugar is safely stabilized.'
      }
    ]
  },
  'pressure-ulcer-staging': {
    title: 'Bed-Bound Pressure Injury Prevention',
    patientProfile: 'Shrimati Savitri Devi (88 years, Bed-bound after Pelvic Fracture)',
    scenario:
      'While helping with morning sponge bathing, you notice a 4 cm area of persistent redness over her sacrum that does not turn white (non-blanchable) when you press it with your finger.',
    condition: 'Stage 1 Pressure Injury (Non-blanchable erythema over bony prominence).',
    category: 'Practical Nursing',
    options: [
      {
        text: 'Vigorously massage the red area with alcohol or mustard oil to increase circulation.',
        isCorrect: false,
        feedback:
          'Incorrect. Massaging erythematous skin over bony prominences causes deep tissue shearing and accelerates ulcer breakdown into Stage 2/3.',
        recommendation:
          'Never massage reddened pressure points.'
      },
      {
        text: 'Implement a strict 2-hour 30-degree lateral repositioning schedule, float heels with pillows, use a dynamic air mattress, and keep skin clean and dry.',
        isCorrect: true,
        feedback:
          'Correct! Offloading pressure via 30-degree tilt and pressure-relieving surfaces allows microvascular reperfusion.',
        recommendation:
          'Use barrier creams for moisture management and ensure adequate dietary protein for tissue integrity.'
      },
      {
        text: 'Keep her in the exact same supine position on a hard wooden surface so the bones heal.',
        isCorrect: false,
        feedback:
          'Incorrect. Unrelieved pressure on bone surfaces leads to full-thickness tissue necrosis within hours.',
        recommendation:
          'Regular offloading every 2 hours is the single most effective pressure ulcer prevention.'
      },
      {
        text: 'Use a rubber donut cushion under her tailbone.',
        isCorrect: false,
        feedback:
          'Incorrect. Donut ring cushions cut off venous blood flow around the perimeter, worsening central tissue ischemia.',
        recommendation:
          'Avoid ring cushions; use whole-body pressure redistributing foam or alternating air overlays.'
      }
    ]
  },
  'parkinsonian-freezing': {
    title: 'Parkinson’s Disease: Overcoming Freezing of Gait',
    patientProfile: 'Shri Raghunath (77 years, Idiopathic Parkinson’s Disease)',
    scenario:
      'While walking into the kitchen doorway, Shri Raghunath’s feet suddenly seem "glued to the floor". He tries to push his upper body forward and begins tipping over.',
    condition: 'Freezing of Gait (FOG) with high risk of forward festinating fall.',
    category: 'Clinical Care',
    options: [
      {
        text: 'Yank his arms forward forcefully to pull his feet loose.',
        isCorrect: false,
        feedback:
          'Incorrect. Pulling a frozen Parkinson\'s patient displaces their center of gravity forward, causing a direct fall.',
        recommendation:
          'Never pull a patient experiencing freezing of gait.'
      },
      {
        text: 'Tell him to stop, stand tall, weight-shift side-to-side, and use a visual/auditory cue (e.g. "Step over my foot" or "1-2-3-Step").',
        isCorrect: true,
        feedback:
          'Correct! External visual and rhythmic auditory cues bypass the impaired basal ganglia pathways through the intact cortical motor circuits.',
        recommendation:
          'Laser canes, floor stripe lines, or rhythmic counting reliably break freezing episodes.'
      },
      {
        text: 'Push him from behind to break the freeze.',
        isCorrect: false,
        feedback:
          'Incorrect. Pushing causes severe loss of balance in patients with impaired postural reflexes.',
        recommendation:
          'Encourage high knee marches and wide turning arcs.'
      },
      {
        text: 'Tell him to pivot sharply on one heel while looking down.',
        isCorrect: false,
        feedback:
          'Incorrect. Tight pivoting is the leading trigger for Parkinsonian falls.',
        recommendation:
          'Teach wide U-turns ("clock turns") rather than sharp pivots.'
      }
    ]
  },
  'anorexia-aging': {
    title: 'Severe Anorexia of Aging & Food Refusal',
    patientProfile: 'Shrimati Rukmini (85 years, Severe Frailty, Progressive Weight Loss)',
    scenario:
      'Shrimati Rukmini is refusing to eat her lunch, pushing the plate away and taking only 2 small bites all day. She complains that food "tastes like cardboard" and her mouth feels sore.',
    condition: 'Age-related taste bud atrophy, dry mouth (xerostomia), and possible ill-fitting dentures/oral thrush.',
    category: 'Caregiver Wellness',
    options: [
      {
        text: 'Force feed her with a large spoon and threaten her that she will get sick if she doesn\'t eat.',
        isCorrect: false,
        feedback:
          'Incorrect. Force feeding causes choking, emotional trauma, and food aversion.',
        recommendation:
          'Explore reversible physical barriers: inspect oral cavity for oral thrush (candidiasis), dental ulcers, or severe dry mouth.'
      },
      {
        text: 'Inspect oral cavity for ulcers/thrush, provide frequent small nutrient-dense soft meals (fortified khichdi, paneer, fruit purée), and enhance aroma with mild Indian spices (cumin, cardamom).',
        isCorrect: true,
        feedback:
          'Correct! Nutrient-dense small frequent meals overcome early satiety, while addressing oral health restores the desire to eat.',
        recommendation:
          'Moistening foods with gravies and keeping the mouth hydrated significantly improves geriatric caloric intake.'
      },
      {
        text: 'Give her only plain water and wait until she is starving enough to eat.',
        isCorrect: false,
        feedback:
          'Incorrect. Starving frail elders rapidly leads to catabolic muscle wasting (sarcopenia) and hypoglycemia.',
        recommendation:
          'Offer frequent high-calorie, high-protein soft feeds.'
      },
      {
        text: 'Immediately insert a nasogastric tube yourself at home without doctor advice.',
        isCorrect: false,
        feedback:
          'Incorrect. Invasive tube feeding requires careful multidisciplinary clinical indication.',
        recommendation:
          'Consult a geriatrician and nutritionist before considering enteral feeding.'
      }
    ]
  },
  'caregiver-burnout-crisis': {
    title: 'Acute Caregiver Distress & Emotional Outburst',
    patientProfile: 'Ananya (42 years, Caring for her father with Vascular Dementia for 3 years)',
    scenario:
      'After her father spills his dinner for the third time today, Ananya bursts into tears, shakes with exhaustion, and confesses to her brother: "I cannot do this anymore. I feel like running away or hurting myself."',
    condition: 'Critical Caregiver Burnout with suicidal ideation / emotional collapse.',
    category: 'Caregiver Wellness',
    options: [
      {
        text: 'Criticize her for being impatient and tell her that filial duty requires silent suffering.',
        isCorrect: false,
        feedback:
          'Incorrect. Guilt-tripping an exhausted caregiver in crisis escalates severe depression and suicide risk.',
        recommendation:
          'Caregiver distress is a legitimate clinical emergency requiring immediate empathy, relief, and professional intervention.'
      },
      {
        text: 'Immediately activate the Crisis Protocol: Relieve her of direct care tasks today, connect with Tele-MANAS (14416) for crisis psychological support, and redistribute care tasks across the Care Circle.',
        isCorrect: true,
        feedback:
          'Correct! Ananya needs immediate physical respite and professional psychological safety triage.',
        recommendation:
          'Utilize Tele-MANAS (14416) or KIRAN (1800-599-0019) for free 24x7 crisis counseling.'
      },
      {
        text: 'Tell her to go for a 5-minute walk and then come right back to continue cooking alone.',
        isCorrect: false,
        feedback:
          'Incorrect. A 5-minute pause does not resolve deep chronic caregiver exhaustion.',
        recommendation:
          'Establish structured weekly respite blocks and shared caregiving schedules.'
      },
      {
        text: 'Ignore her statement assuming she is just exaggerating.',
        isCorrect: false,
        feedback:
          'Incorrect. Expressed feelings of self-harm must always be taken with utmost clinical seriousness.',
        recommendation:
          'Never dismiss distress statements; ensure continuous compassionate support.'
      }
    ]
  },
  'catheter-care-bph': {
    title: 'Urinary Catheter Blockage & Autonomic Distress',
    patientProfile: 'Shri Gopinath (80 years, Benign Prostatic Hyperplasia with Indwelling Foley Catheter)',
    scenario:
      'Shri Gopinath complains of severe lower abdominal fullness and cramping. You notice the urine drainage bag has had 0 mL output over the last 4 hours, and his blood pressure is elevated to 170/95.',
    condition: 'Mechanical catheter blockage leading to acute urinary retention and autonomic response.',
    category: 'Practical Nursing',
    options: [
      {
        text: 'Give him two glasses of water and tell him to push hard to urinate.',
        isCorrect: false,
        feedback:
          'Incorrect. Adding fluids into an obstructed bladder causes extreme bladder distension and risk of rupture.',
        recommendation:
          'Check for mechanical kinks in tubing and ensure the drainage bag is below bladder level.'
      },
      {
        text: 'Check tubing for kinks/compression, ensure bag is below bladder level, gently palpate suprapubic bladder, and contact the home nurse or emergency OPD for catheter irrigation/replacement.',
        isCorrect: true,
        feedback:
          'Correct! Ruling out simple tubing kinks and obtaining prompt clinical flushing/exchange prevents bladder injury and urosepsis.',
        recommendation:
          'Never yank the catheter balloon. Ensure closed sterile drainage hygiene.'
      },
      {
        text: 'Yank the catheter out forcefully without deflating the anchor balloon.',
        isCorrect: false,
        feedback:
          'Incorrect. Pulling an inflated Foley balloon tears the prostatic urethra and causes catastrophic hemorrhage.',
        recommendation:
          'Catheter removal must only be performed by trained staff after completely deflating the retention balloon.'
      },
      {
        text: 'Ignore it and wait for 24 hours to see if urine starts flowing again.',
        isCorrect: false,
        feedback:
          'Incorrect. Complete urinary obstruction leads to hydronephrosis, urosepsis, and acute renal failure within hours.',
        recommendation:
          'Urgent clinical intervention is required for complete catheter obstruction.'
      }
    ]
  },
  'hypertensive-urgency': {
    title: 'Hypertensive Urgency vs Emergency',
    patientProfile: 'Shrimati Annapurna (72 years, Known Hypertensive on Dual Therapy)',
    scenario:
      'Shrimati Annapurna’s digital home BP monitor reads 195/110 mmHg. She complains of a throbbing occipital headache and blurred vision.',
    condition: 'Hypertensive Emergency (Severe BP elevation with end-organ neurological symptoms).',
    category: 'Emergency & Safety',
    options: [
      {
        text: 'Give her three extra doses of her morning pills all at once.',
        isCorrect: false,
        feedback:
          'Incorrect. Dropping blood pressure too precipitously with unmonitored megadoses can cause ischemic cerebral infarction (stroke).',
        recommendation:
          'Blood pressure in hypertensive crises must be controlled in an emergency hospital setting.'
      },
      {
        text: 'Keep her sitting calmly, avoid sudden head movements, and arrange immediate transport to the nearest Emergency Department (or dial 112/108) due to red-flag neurological symptoms (blurred vision, severe headache).',
        isCorrect: true,
        feedback:
          'Correct! The presence of target organ symptoms (headache, vision changes) differentiates Hypertensive Emergency from simple urgency and mandates emergency medical care.',
        recommendation:
          'Bring all current prescription strips to the emergency room for the attending physician.'
      },
      {
        text: 'Tell her to do vigorous brisk walking on the terrace to sweat out the pressure.',
        isCorrect: false,
        feedback:
          'Incorrect. Strenuous physical exertion during severe hypertensive crisis can precipitate intracranial hemorrhage or aortic dissection.',
        recommendation:
          'Enforce strict physical rest and calm breathing.'
      },
      {
        text: 'Assume the machine is faulty and recheck next week.',
        isCorrect: false,
        feedback:
          'Incorrect. Symptomatic severe BP elevations require urgent evaluation, not delayed retesting.',
        recommendation:
          'Prompt clinical triage prevents irreversible vascular events.'
      }
    ]
  },
  'heat-stroke-dehydration': {
    title: 'Summer Heat Exhaustion & Dehydration',
    patientProfile: 'Shri Vishwanath (86 years, Frail, Lives on Top Floor Apartment in May)',
    scenario:
      'On a 42°C summer afternoon, you find Shri Vishwanath with very dry tongue, sunken eyes, skin tenting, dark concentrated urine, and mild disorientation.',
    condition: 'Hyperthermic volume depletion / dehydration with prerenal azotemia risk.',
    category: 'Practical Nursing',
    options: [
      {
        text: 'Wrap him in heavy wool blankets and turn off all fans.',
        isCorrect: false,
        feedback:
          'Incorrect. Trapping heat in an already hyperthermic elder triggers fatal heat stroke.',
        recommendation:
          'Active evaporative cooling and room ventilation are paramount.'
      },
      {
        text: 'Move him to a cool, air-conditioned/ventilated room, loosen tight clothing, offer small sips of oral electrolyte rehydration solution (ORS / lemon water with pinch of salt), and monitor temperature.',
        isCorrect: true,
        feedback:
          'Correct! Controlled cooling and balanced oral electrolyte replacement restores intravascular volume without electrolyte shock.',
        recommendation:
          'Frail elders have blunted thirst sensation; schedule proactive sips every hour in hot weather.'
      },
      {
        text: 'Force him to swallow 2 liters of ice water in 5 minutes.',
        isCorrect: false,
        feedback:
          'Incorrect. Rapid large volume intake causes gastric distension, vomiting, and hyponatremia.',
        recommendation:
          'Give frequent small sips (100-150 mL every 15-20 mins).'
      },
      {
        text: 'Give him an OTC fever tablet and leave him in the sun.',
        isCorrect: false,
        feedback:
          'Incorrect. Antipyretics do not reverse environmental heat illness and can cause hepatic/renal toxicity in dehydrated patients.',
        recommendation:
          'Physical cooling and hydration are the proper management.'
      }
    ]
  },
  'combative-bathing-behavior': {
    title: 'Managing Resistance During Bathing in Dementia',
    patientProfile: 'Shri Prabhakar (82 years, Lewy Body Dementia)',
    scenario:
      'When brought near the bathroom, Shri Prabhakar shouts, strikes out with his cane, and screams that you are trying to drown him in the cold shower.',
    condition: 'Sensory overload, fear of water spray, and spatial disorientation during personal hygiene.',
    category: 'Dementia Care',
    options: [
      {
        text: 'Call two other family members to hold his arms and force him under the running shower spray.',
        isCorrect: false,
        feedback:
          'Incorrect. Physical coercion creates intense fear, deepens trauma, and turns daily care into a dangerous battleground.',
        recommendation:
          'Bathing does not have to be a rigid full shower. Adapt hygiene methods to the patient\'s comfort level.'
      },
      {
        text: 'Step back, lower voice tone, validate his fear ("I won\'t let you get cold, Prabhakar-ji"), ensure the bathroom is warm with no harsh overhead sprays, and switch to a warm towel sponge bath with familiar soothing music.',
        isCorrect: true,
        feedback:
          'Correct! The "Towel Bath" approach preserves dignity, prevents freezing/fear triggers, and cleans effectively without water spray trauma.',
        recommendation:
          'Keep the elder warm and covered with large towels throughout bathing, exposing only one body part at a time.'
      },
      {
        text: 'Deprive him of meals until he agrees to shower.',
        isCorrect: false,
        feedback:
          'Incorrect. Punitive measures are abusive and ineffective for neurodegenerative cognitive impairment.',
        recommendation:
          'Use gentle validation and sensory accommodation.'
      },
      {
        text: 'Spray cold water in his face to shock him into compliance.',
        isCorrect: false,
        feedback:
          'Incorrect. Cold water facial sprays provoke extreme tachycardia, panic, and cardiac strain.',
        recommendation:
          'Maintain warm ambient temperatures and warm water.'
      }
    ]
  },
  'post-op-delirium': {
    title: 'Post-Surgical Delirium after Hip Arthroplasty',
    patientProfile: 'Shrimati Leelavati (78 years, Post-Op Day 2 Total Hip Replacement)',
    scenario:
      'In the recovery ward, Shrimati Leelavati begins pulling out her IV cannula, screaming that the nursing staff are trying to poison her soup, and attempting to climb out of bed on her newly operated hip.',
    condition: 'Hyperactive post-operative delirium secondary to surgical trauma, analgesics, bladder catheter, and unfamiliar environment.',
    category: 'Clinical Care',
    options: [
      {
        text: 'Administer massive unmonitored doses of intramuscular sedatives to put her to sleep instantly.',
        isCorrect: false,
        feedback:
          'Incorrect. Excessive heavy sedation in frail post-op elders increases aspiration, respiratory suppression, and delayed recovery.',
        recommendation:
          'Non-pharmacological reorientation is the first-line treatment for post-op delirium.'
      },
      {
        text: 'Ensure consistent family presence at bedside, provide her reading glasses/hearing aids, gently reorient her to place and time, check for acute urinary retention/pain/hypoxia, and alert the surgical team.',
        isCorrect: true,
        feedback:
          'Correct! Reconnecting sensory aids (glasses/hearing aids) and familiar family presence are proven to dramatically shorten delirium duration.',
        recommendation:
          'Systematically check for unmanaged pain, urinary retention, or low oxygen saturation as delirium triggers.'
      },
      {
        text: 'Scold her loudly and tell her she is ruining her expensive surgery.',
        isCorrect: false,
        feedback:
          'Incorrect. Delirious patients cannot process logical blame; harsh tones heighten paranoia.',
        recommendation:
          'Use a low, steady, reassuring tone.'
      },
      {
        text: 'Turn off all room lights and leave her in total darkness.',
        isCorrect: false,
        feedback:
          'Incorrect. Darkness increases visual misperceptions and hallucinations in delirious brains.',
        recommendation:
          'Maintain adequate soft ambient lighting day and night.'
      }
    ]
  },
  'palliative-secretions': {
    title: 'End-of-Life Secretions & Comfort Care',
    patientProfile: 'Shrimati Kalyani (89 years, Advanced Frailty, Receiving Palliative Home Comfort Care)',
    scenario:
      'Shrimati Kalyani is in a deep, peaceful sleep during her final days. Her breathing develops a loud, coarse rattling sound in the throat ("death rattle"). Her daughter is terrified that she is choking and drowning.',
    condition: 'Terminal respiratory secretions due to loss of swallow reflex in semi-conscious state.',
    category: 'Caregiver Wellness',
    options: [
      {
        text: 'Perform aggressive deep tracheal suctioning through her mouth with a rigid tube.',
        isCorrect: false,
        feedback:
          'Incorrect. Deep suctioning causes gagging, bleeding, coughing spasms, and severe distress to a dying patient with minimal benefit.',
        recommendation:
          'Terminal secretions do not cause distress to the unconscious patient, though they are alarming to family.'
      },
      {
        text: 'Reassure the family that the patient is not choking or in pain; gently position her in a side-lying posture with head slightly elevated to allow secretions to drain passively, and moisten lips with swabs.',
        isCorrect: true,
        feedback:
          'Correct! Side-lying positioning uses gravity to drain secretions, while reassuring the family relieves their profound panic.',
        recommendation:
          'Anticholinergic patches/drops (e.g. Hyoscine) under palliative guidance can reduce new secretion formation.'
      },
      {
        text: 'Shake her vigorously to force her to cough it up.',
        isCorrect: false,
        feedback:
          'Incorrect. Shaking causes distress and disturbs the peaceful dying process.',
        recommendation:
          'Prioritize comfort, gentle touch, and quiet presence.'
      },
      {
        text: 'Start rapid IV fluid infusion at maximum rate.',
        isCorrect: false,
        feedback:
          'Incorrect. Overhydration at the end of life increases pulmonary congestion, edema, and worsening secretions.',
        recommendation:
          'Focus on mouth care (moist sponge swabs) rather than excessive parenteral fluid loading.'
      }
    ]
  },
  'exercise-hesitancy': {
    title: 'Overcoming Exercise Hesitancy in Osteoarthritis',
    patientProfile: 'Shri Madhavan (77 years, Bilateral Knee Osteoarthritis & Sarcopenia)',
    scenario:
      'Shri Madhavan has completely stopped walking or doing his daily exercises because his knees ache, saying: "If I walk, the bone will grind down completely."',
    condition: 'Fear-avoidance behavior leading to rapid disuse muscle atrophy and joint stiffness.',
    category: 'Practical Nursing',
    options: [
      {
        text: 'Agree with him and tell him strict total bed rest is the only cure for arthritis.',
        isCorrect: false,
        feedback:
          'Incorrect. "Motion is lotion" — immobilization causes quadriceps muscle wasting and worsens joint pain.',
        recommendation:
          'Low-impact non-weight-bearing exercises preserve cartilage nutrition.'
      },
      {
        text: 'Explain that gentle non-weight bearing exercises (seated knee extensions, aquatic therapy, recumbent cycling) lubricate the joint and strengthen supportive thigh muscles without impact.',
        isCorrect: true,
        feedback:
          'Correct! Strengthening the quadriceps reduces impact loads on the knee joint by up to 30%.',
        recommendation:
          'Start with 5-minute seated sessions and celebrate small mobility gains.'
      },
      {
        text: 'Force him to run on a treadmill for 30 minutes to push through the pain.',
        isCorrect: false,
        feedback:
          'Incorrect. High-impact running on severe bone-on-bone arthritis causes joint inflammation and injury.',
        recommendation:
          'Use gentle, progressive closed-chain exercises.'
      },
      {
        text: 'Tell him to take high-dose steroids every day before moving.',
        isCorrect: false,
        feedback:
          'Incorrect. Uncontrolled oral steroids cause severe osteoporosis, hyperglycemia, and immunosuppression.',
        recommendation:
          'Rely on physical therapy and safe analgesics.'
      }
    ]
  },
  'constipation-management': {
    title: 'Managing Chronic Opioid vs Frailty Constipation',
    patientProfile: 'Shri Dinanath (83 years, Immobility & Severe Chronic Lower Back Pain on Analgesics)',
    scenario:
      'Shri Dinanath has not passed stool for 5 days. His family has been feeding him massive doses of raw dry psyllium husk (Isabgol) with minimal water, and he now has severe abdominal cramping.',
    condition: 'Fecal impaction risk exacerbated by bulk fiber without adequate fluid intake.',
    category: 'Clinical Care',
    options: [
      {
        text: 'Double the dry psyllium husk dose and give no water.',
        isCorrect: false,
        feedback:
          'Incorrect. Bulk-forming fiber without sufficient hydration turns into a cement-like plug in an immobile bowel, causing complete intestinal obstruction.',
        recommendation:
          'Avoid bulk fibers in bed-bound elders with low fluid intake.'
      },
      {
        text: 'Stop dry bulk fiber immediately; consult for osmotic laxatives (Polyethylene Glycol / Lactulose) and gentle abdominal massage, and assess for distal fecal impaction.',
        isCorrect: true,
        feedback:
          'Correct! Osmotic laxatives draw water into the stool without forming solid bulk plugs, making them first-line for frail elders.',
        recommendation:
          'Ensure regular fluid intake, prune purée, and scheduled post-breakfast toilet positioning with footstool.'
      },
      {
        text: 'Administer 5 stimulant laxatives all at once without examining the bowel.',
        isCorrect: false,
        feedback:
          'Incorrect. High-dose stimulants against a hard impaction cause severe griping cramps and potential bowel perforation.',
        recommendation:
          'Soften from above or lubricate from below before stimulating peristalsis.'
      },
      {
        text: 'Ignore the 5 days of no bowel movement as normal.',
        isCorrect: false,
        feedback:
          'Incorrect. Prolonged constipation in seniors causes stercoral ulcers, delirium, and urinary retention.',
        recommendation:
          'Establish a reliable 48-hour bowel protocol.'
      }
    ]
  }
};
