
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ComponentsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Button variant="outline" asChild>
        <Link href="/assessment-guide">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessment Guide
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">
            Part III: Core Clinical Content of Geriatric Training Modules
          </CardTitle>
          <CardDescription>
            Beyond the structural frameworks and audience adaptations, the effectiveness of any geriatric care module hinges on the depth and quality of its clinical content. A robust curriculum must equip learners with the specific knowledge and skills needed to address the most common and high-risk challenges faced by older adults.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 3.1: The Challenge of Complexity: Managing Multimorbidity and Polypharmacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Two of the most defining and intertwined challenges in geriatric medicine are multimorbidity—the co-occurrence of two or more chronic conditions—and polypharmacy, the use of multiple medications. Educational modules focused on these topics are essential for preparing clinicians to provide safe and effective care.
          </p>
          <h4 className="font-semibold">Multimorbidity Management</h4>
          <p>
            Training in multimorbidity management begins with the fundamental understanding that in older adults, the presence of multiple chronic conditions is the norm, not the exception. This reality makes clinical management inherently complex, as the standard single-disease guidelines often do not apply and may even conflict with one another. Educational interventions are therefore defined as strategies designed to improve the health and quality of life for individuals navigating this complexity. A cornerstone of this training is the emphasis on an integrated and multidisciplinary approach. Effective management requires the establishment of integrated care pathways that connect various healthcare providers (primary care, specialists, therapists) and services (social services, community organizations). Modules teach the critical importance of team-based care, shared decision-making, and consistent communication to ensure continuity of care across different settings.
          </p>
          <h4 className="font-semibold">Polypharmacy and Deprescribing</h4>
          <p>
            Closely linked to multimorbidity is polypharmacy, which is formally defined as the regular use of five or more medications. It is so prevalent and carries such significant risk that it is often considered a geriatric syndrome in its own right. Older adults, who comprise about 14% of the U.S. population, account for over one-third of all outpatient spending on prescription medications. This high medication burden is a major risk factor for adverse outcomes, including falls, frailty, cognitive impairment, disability, and even mortality.
          </p>
          <p>
            To address this, training modules provide detailed instruction on the principles of geriatric pharmacotherapy. This includes a thorough review of the physiological changes of aging that alter pharmacokinetics and pharmacodynamics. For example, learners are taught that because older adults have a higher percentage of body fat and a lower percentage of body water, lipophilic (fat-soluble) drugs have an increased volume of distribution (leading to a longer half-life), while hydrophilic (water-soluble) drugs have a lower volume of distribution (leading to higher initial concentrations). Similarly, they learn that because of age-related decreases in muscle mass and creatinine production, a "normal" serum creatinine level can mask a significantly reduced glomerular filtration rate, leading to the dangerous accumulation of renally cleared drugs.
          </p>
          <p>
            The most critical skill taught in this domain is deprescribing and medication review. This is the systematic process of identifying and discontinuing medications for which the potential harms outweigh the potential benefits within the context of an individual patient's care goals, life expectancy, and preferences. Clinicians are trained to recognize and halt "prescribing cascades," a common pitfall where an adverse drug effect (e.g., dizziness) is misinterpreted as a new medical condition and treated with yet another drug, compounding the problem. A variety of educational tools, including online learning modules that use fictional cases, evidence-based deprescribing algorithms, and mobile apps, are available to help healthcare professionals master this essential skill.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 3.2: The Mind in Aging: Addressing the "3Ds" of Cognitive Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Cognitive and affective disorders are highly prevalent in older adults and have a profound impact on function, quality of life, and caregiver burden. A core component of any geriatric curriculum is dedicated to the "3Ds": Delirium, Dementia, and Depression. The primary educational challenge lies in teaching learners to differentiate among these three syndromes, as they often present with overlapping symptoms and can be complicated by underlying medical comorbidities.
          </p>
          <h4 className="font-semibold">Depression</h4>
          <p>
            Depression is common, with significant depressive symptoms affecting up to 20% of community-dwelling older adults. It is a serious condition associated with poor outcomes for other medical problems and an increased risk for suicide. Training emphasizes that depression in older adults often presents atypically. Instead of or in addition to expressing sadness, an older person may present with physical complaints like fatigue and appetite changes, social withdrawal, or irritability. A key diagnostic clue taught to learners is that patients with depression are often distressed by their cognitive difficulties and are more likely to bring concerns about memory impairment to a physician's attention. This contrasts with patients with dementia, who may lack insight into their deficits.
          </p>
           <h4 className="font-semibold">Dementia</h4>
          <p>
            Dementia is a chronic and progressive decline in cognitive function. Because cognitive impairment is sometimes mistakenly viewed as a normal part of aging, early or mild dementia can go undetected. Training focuses on teaching clinicians to recognize subtle signs, such as missed appointments, poor hygiene, or difficulty following instructions. Modules cover the use of validated screening tools, like the Folstein Mini-Mental State Examination (MMSE) or the Memory Impairment Screen, to formally assess cognitive function. Education for nurses and other team members also includes content on the causes, typical symptoms, and progression of common dementia subtypes like Alzheimer's disease, as well as dementia-focused communication techniques to improve interactions with patients and families.
          </p>
           <h4 className="font-semibold">Delirium</h4>
          <p>
            Delirium is an acute, fluctuating disturbance of consciousness and attention, and is considered a medical emergency. It is one of the most common geriatric syndromes, yet it is frequently underrecognized and therefore undertreated. Educational modules for delirium are designed to improve recognition and management. They emphasize the use of structured assessment tools like the Confusion Assessment Method (CAM), which screens for the core features of delirium. Effective educational interventions for delirium are multifaceted; they must go beyond simple didactic teaching to include enabling strategies (e.g., integrating the CAM into the electronic health record) and reinforcing strategies (e.g., regular feedback, case-based discussions). Once delirium is identified, management focuses heavily on non-pharmacologic interventions. These include reorienting the patient frequently, maintaining a proper sleep-wake cycle (e.g., opening blinds during the day, minimizing noise at night), ensuring sensory aids like glasses and hearing aids are in use, and promoting early mobilization.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
