
import {
  BrainCircuit,
  HeartPulse,
  Activity,
  User,
  ShieldAlert,
  Accessibility,
  PersonStanding,
  Recycle,
  Dumbbell,
  HeartHandshake,
  Users,
  Stethoscope,
  Brain,
  Droplets,
  Footprints,
  Bone,
  Utensils,
  Eye,
  Smile,
  Pill,
  Shield,
  Siren,
} from 'lucide-react';

export const iconMap: { [key: string]: React.ElementType } = {
  'Alzheimer\'s Disease': BrainCircuit,
  'Heart Disease': HeartPulse,
  'Medication Safety': Shield,
  'Delirium': Brain,
  'Hypertension': HeartPulse,
  'Geriatric Rehabilitation': Recycle,
  'Strength Training': Dumbbell,
  'Palliative Care Professional': Users,
  'Geriatric Depression': Stethoscope,
  'Urinary Problems': Droplets,
  'Podogeriatrics': Footprints,
  'Rheumatic Disorders': Bone,
  'Clinical Nutrition': Utensils,
  'Geriatric Ophthalmology': Eye,
  'Geriatric Oral Health': Smile,
  'Constipation': Utensils,
  'Pneumonia': Siren,
  'Parkinsonism Care': User,
  'Stroke': Activity,
  'Bed Bound Care': Accessibility,
  'Fall Prevention': PersonStanding,
  'Palliative Care': HeartHandshake,
  'Foot Care': Footprints,
  'Joint Problems': Bone,
  'Nutrition': Utensils,
  'Vision Problems': Eye,
  'Oral Health': Smile,
  'Exercise': Dumbbell,
};

export const caregiverModules = [
  {
    id: 'medication-management-caregiver',
    title: 'Helping Your Loved One Stay Safe with Medicines',
    description: 'Learn to manage medications safely and act as a key partner in their healthcare.',
    category: 'Medication Safety',
  },
  {
    id: 'fall-prevention',
    title: 'Staying Steady and Safe: Fall Prevention',
    description:
      'Learn to identify risks and create a safe environment to prevent falls.',
    category: 'Fall Prevention',
  },
  {
    id: 'nutrition-caregiver',
    title: 'Nutrition and Feeding Issues',
    description:
      'Learn about malnutrition, feeding problems, and strategies to improve nutrition.',
    category: 'Nutrition',
  },
  {
    id: 'strength-training-caregiver',
    title: 'Supporting Physical Activity',
    description: 'A caregiver\'s guide to encouraging exercise and physical fitness for older adults.',
    category: 'Exercise',
  },
  {
    id: 'constipation-caregiver',
    title: 'Managing Constipation: A Caregiver\'s Guide',
    description: 'Learn to understand, prevent, and manage constipation safely and effectively.',
    category: 'Constipation',
  },
  {
    id: 'oral-health-caregiver',
    title: 'Oral Health for Caregivers',
    description: 'Learn to manage daily oral care and identify common dental issues in older adults.',
    category: 'Oral Health',
  },
  {
    id: 'bed-bound-care',
    title: 'Bed Bound Patient Care',
    description:
      'Essential care for bed-bound patients: pressure ulcer prevention, hygiene, and mobility.',
    category: 'Bed Bound Care',
  },
  {
    id: 'alzheimers-caregiver',
    title: "A Caregiver's Guide to Alzheimer's Disease",
    description: 'An in-depth guide to understanding the stages, diagnosis, and behavioral changes of Alzheimer\'s.',
    category: 'Alzheimer\'s Disease',
  },
  {
    id: 'ischaemic-heart-disease-caregiver',
    title: 'Caring for a Loved One with Heart Disease',
    description: 'A practical guide for families on recognizing symptoms and supporting heart health.',
    category: 'Heart Disease',
  },
  {
    id: 'dementia-care',
    title: "A Caregiver's Guide to Delirium",
    description:
      'Learn to recognize, prevent, and respond to sudden confusion in a loved one.',
    category: 'Delirium',
  },
  {
    id: 'stroke-rehab',
    title: 'Stroke Rehabilitation',
    description:
      'Principles of stroke rehab, including mobility, speech therapy, and preventing complications.',
    category: 'Stroke',
  },
  {
    id: 'hypertension-caregiver',
    title: 'Hypertension: A Caregiver\'s Guide',
    description:
      'Learn to manage high blood pressure safely with a focus on quality of life.',
    category: 'Hypertension',
  },
  {
    id: 'parkinsonism-care',
    title: 'Living with Parkinson\'s Disease: A Detailed Guide',
    description:
      "A detailed guide to understanding symptoms, managing medications, and supporting daily life with PD.",
    category: 'Parkinsonism Care',
  },
  {
    id: 'palliative-care-caregiver',
    title: 'Palliative Care: A Guide for Caregivers',
    description:
      'A compassionate guide to understanding and navigating palliative care for a loved one.',
    category: 'Palliative Care',
  },
  {
    id: 'benign-prostate-care',
    title: 'Urinary Problems in Men',
    description:
      'Understand common urinary issues like BPH and learn practical tips for management.',
    category: 'Urinary Problems',
  },
   {
    id: 'foot-care',
    title: 'Foot Care Essentials',
    description:
      'Learn the basics of foot care for older adults to maintain mobility and prevent complications.',
    category: 'Foot Care',
  },
  {
    id: 'joint-problems-caregiver',
    title: 'Understanding Joint Pain & Arthritis',
    description:
      'Learn about common joint problems like arthritis and gout and how to manage them at home.',
    category: 'Joint Problems',
  },
  {
    id: 'vision-problems-caregiver',
    title: 'Vision and Eye Problems',
    description:
      'Learn to recognize common eye issues, red flags, and when to see a doctor.',
    category: 'Vision Problems',
  },
  {
    id: 'lung-infections-caregiver',
    title: 'Protecting Your Loved One from Pneumonia',
    description: 'A guide to spotting the tricky warning signs of pneumonia and how you can help prevent it.',
    category: 'Pneumonia',
  },
];

export const professionalModules = [
   {
    id: 'polypharmacy-professional',
    title: 'Medication Safety in Geriatric Care',
    description: 'A nurse\'s guide to identifying, preventing, and managing adverse drug events (ADEs) in older patients.',
    category: 'Medication Safety',
  },
  {
    id: 'strength-training',
    title: 'Prescribing Exercise for Older Adults',
    description:
      'A module for healthcare professionals on promoting and prescribing physical activity.',
    category: 'Exercise',
  },
  {
    id: 'constipation-professional',
    title: 'Managing Constipation in Older Adults',
    description: 'A clinical guide for nurses on the assessment, management, and prevention of constipation.',
    category: 'Constipation',
  },
  {
    id: 'oral-health-professional',
    title: 'Geriatric Oral Health for Professionals',
    description: 'A review of oral health screening, common challenges, and interprofessional care for clinicians.',
    category: 'Geriatric Oral Health',
  },
  {
    id: 'nutrition-care-professional',
    title: 'Clinical Nutrition in Older Adults',
    description:
        'A review of malnutrition, screening, assessment, and management strategies for clinicians.',
    category: 'Clinical Nutrition',
  },
  {
    id: 'alzheimers-professional',
    title: "A Comprehensive Nursing Guide to Alzheimer's Disease",
    description: 'A clinical framework covering pathophysiology, risk factors, diagnosis, and behavioral assessment of AD.',
    category: 'Alzheimer\'s Disease',
  },
  {
    id: 'ischaemic-heart-disease-professional',
    title: 'Managing Ischaemic Heart Disease in Older Adults',
    description: 'A nursing perspective on atypical presentations, risk management, and patient-centered care.',
    category: 'Heart Disease',
  },
  {
    id: 'dementia-care-professional',
    title: 'A Comprehensive Nursing Guide to Delirium',
    description:
      'A detailed clinical framework for the assessment, diagnosis, and complex management of delirium.',
    category: 'Delirium',
  },
  {
    id: 'hypertension-professional',
    title: 'Hypertension in Older Adults',
    description:
      'A clinical overview of the unique aspects of hypertension in the geriatric population.',
    category: 'Hypertension',
  },
  {
    id: 'geriatric-rehabilitation',
    title: 'Geriatric Rehabilitation',
    description:
      'Understand the interventions that help restore function and independence in older adults.',
    category: 'Geriatric Rehabilitation',
  },
  {
    id: 'palliative-care-professional',
    title: 'Palliative Care for Professionals',
    description:
      'An evidence-based overview of geriatric palliative care principles and practice for clinicians.',
    category: 'Palliative Care Professional',
  },
  {
    id: 'geriatric-depression-professional',
    title: 'Geriatric Depression in Primary Care',
    description:
      'A review of the detection and management of depression in older adults for primary care providers.',
    category: 'Geriatric Depression',
  },
  {
    id: 'benign-prostate-professional',
    title: 'Benign Prostatic Conditions',
    description:
      'A clinical review of the evaluation and management of BPH and prostatitis in older men.',
    category: 'Urinary Problems',
  },
   {
    id: 'foot-care-professional',
    title: 'Podogeriatrics: Clinical Foot Care',
    description:
      'A clinical review of common foot pathologies, assessment, and management in older adults.',
    category: 'Podogeriatrics',
  },
  {
    id: 'joint-problems-professional',
    title: 'Management of Rheumatic Disorders',
    description:
      'A clinical review of OA, RA, Gout, and other common rheumatic conditions in older adults.',
    category: 'Rheumatic Disorders',
  },
  {
    id: 'vision-problems-professional',
    title: 'Clinical Geriatric Ophthalmology',
    description:
        'A review of common age-related eye diseases, diagnosis, and management for clinicians.',
    category: 'Geriatric Ophthalmology',
  },
  {
    id: 'lung-infections-professional',
    title: 'Pneumonia in Older Adults: A Clinical Guide',
    description: 'A clinical framework for the assessment, triage, and management of pneumonia in geriatric patients.',
    category: 'Pneumonia',
  },
  {
    id: 'parkinsonism-care-professional',
    title: 'A Comprehensive Nursing Guide to Parkinson\'s Disease',
    description: 'A detailed clinical framework for the assessment, diagnosis, and complex management of PD.',
    category: 'Parkinsonism Care',
  },
];


export const allModules = [
    ...caregiverModules,
    ...professionalModules
].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) {
        acc.push(current);
    }
    return acc;
}, [] as (typeof caregiverModules[0])[]);
