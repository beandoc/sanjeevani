
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, Beaker, ShieldCheck, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NutritionCareProfessionalPage() {
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
          Clinical Nutrition in Older Adults
        </h1>
        <p className="text-muted-foreground">
          A module on the assessment, diagnosis, and management of malnutrition in the geriatric population.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Pathophysiology and Risk Factors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Etiology of Geriatric Malnutrition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Malnutrition (undernutrition) in older adults is a multifactorial syndrome driven by physiologic, psychological, social, and environmental factors. It is not caused by aging itself, but by age-related changes and comorbid conditions.
                </p>
                <h4 className="font-semibold">Key Contributing Factors:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Physiologic Changes:</strong> Anorexia of aging, chemosensory changes (smell/taste), slowed gastric motility, and sarcopenia all impact nutritional intake and requirements.
                  </li>
                  <li>
                    <strong>Psychosocial Factors:</strong> Depression, loneliness, bereavement, and cognitive impairment (especially dementia) are potent risk factors for weight loss.
                  </li>
                  <li>
                    <strong>Socioeconomic & Environmental:</strong> Poverty, food insecurity, and lack of transportation or ability to prepare meals significantly increase risk.
                  </li>
                   <li>
                    <strong>Chronic Disease & Polypharmacy:</strong> Inflammation from chronic illness increases metabolic demand, while medication side effects (e.g., xerostomia, anorexia, GI upset) can decrease intake.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              Screening and Assessment
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <Card>
              <CardHeader>
                <CardTitle>Identifying At-Risk Individuals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Early identification through screening is crucial. An in-depth assessment should follow a positive screen.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Screening Tools:</strong> The Mini-Nutritional Assessment Short-Form (MNA-SF) is a validated and recommended tool. The DETERMINE checklist is also used, particularly for self-administration in community settings.
                    </li>
                    <li>
                        <strong>Comprehensive Assessment:</strong> A full assessment includes anthropometrics (weight, height, BMI), evaluating for clinically relevant weight loss (≥5% in 6-12 months), a focused nutrition physical exam (muscle/fat loss, fluid accumulation), dietary history, and functional status (e.g., handgrip strength).
                    </li>
                </ul>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>Diagnostic Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>The Academy of Nutrition and Dietetics/ASPEN consensus recommends a diagnosis of malnutrition based on the presence of at least two of the following six characteristics:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Insufficient energy intake</li>
                    <li>Weight loss</li>
                    <li>Loss of muscle mass</li>
                    <li>Loss of subcutaneous fat</li>
                    <li>Localized or generalized fluid accumulation that may mask weight loss</li>
                    <li>Diminished functional status as measured by handgrip strength</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Beaker className="h-6 w-6 text-primary" />
              The Role of Laboratory Markers
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>
              Biochemical indicators previously used to diagnose malnutrition are now understood differently in the context of inflammation.
            </p>
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>Albumin and Prealbumin:</strong> These are no longer considered direct markers of nutritional status. They are negative acute-phase reactants, meaning their levels decrease in the presence of inflammation, regardless of nutrient intake.
                </li>
                <li>
                    <strong>C-Reactive Protein (CRP):</strong> An elevated CRP indicates inflammation. Interpreting albumin levels alongside CRP is recommended. A low albumin with a normal CRP is more suggestive of poor protein status, whereas a low albumin with a high CRP primarily reflects an inflammatory state.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Management Principles
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>Management requires a multidisciplinary approach focused on treating underlying causes and improving nutritional intake.</p>
             <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>Liberalize Restrictive Diets:</strong> For many older adults, especially those ≥75, the risks of diet restrictions (e.g., low sodium, diabetic) often outweigh the benefits if they lead to poor intake.
                </li>
                <li>
                    <strong>Oral Nutrition Supplements (ONS):</strong> High-calorie, high-protein supplements are effective. They should be given between meals, not with meals, to avoid replacing food intake.
                </li>
                <li>
                    <strong>Food Fortification:</strong> Increase the energy and protein density of regular foods by adding powders (protein, maltodextrin), oils, or creams.
                </li>
                 <li>
                    <strong>Dysphagia Management:</strong> For patients with swallowing difficulties, consult a speech therapist. Interventions include texture-modified diets (e.g., pureed, minced) and thickened liquids.
                </li>
                <li>
                    <strong>Enteral/Parenteral Nutrition:</strong> Consider specialized nutrition support only when a patient cannot eat adequately and the benefits outweigh the risks. Always consider the patient's advance directives.
                </li>
                 <li>
                    <strong>Refeeding Syndrome:</strong> In severely malnourished patients, monitor electrolytes (especially phosphate, potassium, magnesium) and fluid status carefully during the first week of nutritional repletion to prevent this potentially fatal complication.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
