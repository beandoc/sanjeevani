
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Users, HeartPulse, Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GeriatricDepressionProfessionalPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
       <Button variant="outline" asChild>
        <Link href="/modules">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Geriatric Depression in Primary Care
        </h1>
        <p className="text-muted-foreground">
          A review of common barriers, effective treatment strategies, and opportunities for addressing health disparities in geriatric depression care.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Introduction & Epidemiology
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>The Scope of the Problem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Depression is a leading cause of disability worldwide and a serious public health problem among older adults. Primary care settings are the "de facto mental health care system" where up to 80% of older Americans with depression receive their care. Approximately 5-10% of older adults in primary care have clinically significant depression, but it is often undetected and undertreated.
                </p>
                <h4 className="font-semibold">Key Statistics:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Community Settings:</strong> About 5% of adults over 65 meet criteria for major depression, with 8-16% having subsyndromal depression.
                    </li>
                    <li>
                        <strong>Primary Care Detection:</strong> Primary care providers detect only 40-50% of depression cases in older adults.
                    </li>
                    <li>
                        <strong>Effective Treatment:</strong> Only about one in five older adults with depression receives effective treatment in primary care.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Barriers, Risk Factors, and Clinical Presentation
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <h4 className="font-semibold text-lg">Barriers to Effective Treatment</h4>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Patient-Level:</strong> Atypical presentation (somatic complaints), attributing symptoms to "normal aging," stigma, and poor adherence.
                </li>
                <li>
                    <strong>Provider-Level:</strong> Time pressure, inadequate knowledge, and lack of a psychosocial orientation.
                </li>
                <li>
                    <strong>System-Level:</strong> Productivity pressures, limited mental health coverage, and lack of systematic approaches to care.
                </li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Risk and Protective Factors</h4>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Risk Factors:</strong> Female gender, being unmarried, poverty, chronic physical illness, social isolation, loss and grief, and caregiving responsibilities. 'Vascular depression' is a subtype associated with cerebrovascular changes.
                </li>
                <li>
                    <strong>Protective Factors:</strong> Social support, social activities (volunteering), physical activity, religion, and spirituality.
                </li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Atypical Clinical Presentation</h4>
             <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    Older adults may not report sadness. Look for anhedonia, avolition, low energy, and unexplained physical symptoms.
                </li>
                <li>
                    Depression often co-occurs with chronic pain, especially arthritis pain.
                </li>
                <li>
                    Subsyndromal depression is common, carries a similar burden to major depression, and is a high-risk state for developing major depression.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              Depression Management Strategies in Primary Care
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>Late-life depression is treatable with appropriate psychosocial and pharmacological interventions. Strategies to improve care delivery are crucial.</p>
             <h4 className="font-semibold text-lg">Detection and Screening</h4>
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>Brief Screens:</strong> Use simple, validated tools like the single-item screen ("Do you often feel sad or depressed?") or the PHQ-2 for initial screening.
                </li>
                <li>
                    <strong>Longer Tools for Monitoring:</strong> The Geriatric Depression Scale (GDS) or the PHQ-9 can be used to establish a diagnosis and track symptoms over time.
                </li>
            </ul>
            <h4 className="font-semibold text-lg mt-4">Stepped Care</h4>
            <p>This model begins with the least intrusive interventions and "steps up" treatment intensity if the patient is not improving.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Step 1:</strong> Encourage self-directed interventions like pleasant events scheduling or physical activity.
              </li>
              <li>
                <strong>Step 2:</strong> Offer more intensive options like guided self-help, psychotherapy, or medication if needed.
              </li>
              <li>
                <strong>Key Feature:</strong> Systematic monitoring of symptoms with objective measures (like the PHQ-9) to guide treatment decisions.
              </li>
            </ul>
             <h4 className="font-semibold text-lg mt-4">Collaborative Care</h4>
            <p>This is a highly effective model where primary care providers work closely with patients and a consulting mental health specialist.</p>
             <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Core Team:</strong> The PCP, the patient, and a consulting mental health specialist.
              </li>
              <li>
                <strong>Depression Care Manager:</strong> A nurse, social worker, or psychologist who coordinates treatment, supports adherence, educates the patient, and provides brief psychotherapy (e.g., Problem-Solving Treatment).
              </li>
              <li>
                <strong>Consulting Psychiatrist:</strong> Provides regular, case-load focused consultation on patients who are not improving.
              </li>
              <li>
                <strong>Proven Effectiveness:</strong> Collaborative care models like IMPACT and PROSPECT have been shown to double the effectiveness of usual care for depression.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
         <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              Health Disparities and the Role of Family
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <h4 className="font-semibold text-lg">Addressing Health Disparities</h4>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>High-Risk Groups:</strong> Older adults with lower socioeconomic status, from ethnic minority groups, and older men are at particularly high risk for poor depression outcomes.
              </li>
              <li>
                <strong>Cultural Considerations:</strong> Culture influences how depression is experienced and expressed (e.g., somatic vs. psychological symptoms). Treatment must be culturally sensitive.
              </li>
               <li>
                <strong>Collaborative Care's Role:</strong> Collaborative care programs that offer both pharmacological and non-pharmacological options have been shown to improve outcomes for older minorities and low-income Americans.
              </li>
            </ul>
            <h4 className="font-semibold text-lg mt-4">Engaging Family as Partners</h4>
             <ul className="list-disc space-y-2 pl-5">
              <li>
                Family caregivers of depressed older adults experience significant burden, similar to caregivers of patients with Alzheimer's disease.
              </li>
              <li>
                Positive family support is a key predictor of good depression outcomes and can help with treatment adherence.
              </li>
               <li>
                Providing education and support to family caregivers can benefit both the patient and the caregiver, and may serve as a form of secondary prevention for at-risk caregivers.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
