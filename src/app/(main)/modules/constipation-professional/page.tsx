
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function ConstipationProfessionalPage() {
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
          Managing Constipation in Older Adults: A Clinical Guide
        </h1>
        <p className="text-muted-foreground">
          An evidence-based framework for assessing, managing, and preventing constipation in geriatric patients.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Redefining Constipation in Geriatric Practice
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  While clinically defined as fewer than three bowel movements per week, older patients more often describe constipation as difficulty with defecation, straining, or hard stools. It's crucial to understand the patient's perspective.
                </p>
                <p className="font-semibold">Busting the Myth: Age alone is not an independent risk factor for reduced stool frequency. Constipation in older adults is typically multifactorial, resulting from the combined effects of medications, comorbid diseases, immobility, and reduced caloric intake.</p>
                <h4 className="font-semibold">Key Distinctions:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Primary vs. Secondary:</strong> Primary has no obvious cause; secondary results from external factors (meds, metabolic issues).</li>
                  <li><strong>Acute vs. Chronic:</strong> Acute onset requires rapid investigation for obstruction or medication changes. Chronic symptoms have been present for over three months.</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Clinical Assessment: History and Physical Exam
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader><CardTitle>History Taking</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Onset and Duration:</strong> Is it acute or chronic?</li>
                    <li><strong>Symptoms:</strong> Go beyond frequency. Ask about straining, incomplete evacuation, hard stools (use the Bristol Stool Chart), and the need for perineal splinting or manual assistance (digitation).</li>
                    <li><strong>Medication Review:</strong> Scrutinize all medications, especially opiates, calcium channel blockers, NSAIDs, and anticholinergic drugs.</li>
                    <li><strong>Alarm Symptoms ("Red Flags"):</strong> Rectal bleeding, weight loss, iron deficiency anemia, or a new, acute onset warrant a prompt structural evaluation (e.g., colonoscopy).</li>
                </ul>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader><CardTitle>Physical Examination</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p>A rectal exam is essential. Assess for:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Fecal Impaction:</strong> The first sign may be paradoxical "overflow" diarrhea.</li>
                    <li><strong>Perineal Descent:</strong> Normal is 1-4 cm with strain. No descent may suggest failure of pelvic floor relaxation.</li>
                    <li><strong>Sphincter Tone:</strong> Assess resting and squeeze pressures. Weakness can increase incontinence risk with treatment.</li>
                    <li><strong>Paradoxical Contraction:</strong> Contraction during strain suggests dyssynergic defecation.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader><CardTitle>The Bristol Stool Chart</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                <p>Use this validated tool to objectively assess stool consistency. Types 1 and 2 are associated with constipation.</p>
                <div className="relative aspect-[4/3] w-full">
                    <Image src="https://picsum.photos/600/450" alt="Bristol Stool Chart" fill data-ai-hint="chart health" className="rounded-md object-cover" />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              A Step-Wise Management Approach
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <h4 className="font-semibold text-lg">Step 1: Non-Pharmacological Interventions & Medication Review</h4>
            <ul className="list-disc space-y-2 pl-5">
                <li><strong>Medication Adjustment:</strong> This is paramount. Eliminate or substitute constipating drugs whenever possible.</li>
                <li><strong>Fibre:</strong> Aim for 20-30 g per day from diet or supplements (psyllium, methylcellulose). Crucially, ensure adequate fluid intake to avoid worsening the problem.</li>
                <li><strong>Caution:</strong> Avoid bulking agents in patients who are bedbound, have minimal fluid intake, or have a suspected fecal impaction.</li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Step 2: Osmotic Laxatives</h4>
             <p>These increase water retention in the gut lumen. Polyethylene Glycol (PEG) is superior to lactulose in efficacy and tolerability (less bloating/gas) and is the preferred osmotic agent in older adults.</p>
             <p><strong>Avoid/Use Caution:</strong> Magnesium salts should not be used in patients with renal disease due to the risk of hypermagnesemia.</p>

            <h4 className="font-semibold text-lg mt-4">Step 3: Stimulant Laxatives</h4>
             <p>Use when osmotic laxatives are insufficient. Common agents include senna and bisacodyl. The idea that these drugs cause "laxative dependence" or damage the colon is a medical myth; they are safe when used at recommended doses.</p>

             <h4 className="font-semibold text-lg mt-4">Step 4: Advanced & Targeted Therapies</h4>
             <ul className="list-disc space-y-2 pl-5">
                <li><strong>Opioid-Induced Constipation (OIC):</strong> For refractory OIC, use peripherally acting mu-opioid receptor antagonists (PAMORAs) like methylnaltrexone.</li>
                <li><strong>Dyssynergic Defecation:</strong> The mainstay of treatment is biofeedback therapy, which is superior to laxatives for this condition.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Special Populations and Complications
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <ul className="list-disc space-y-4 pl-5">
              <li><strong>Fecal Impaction:</strong> Suspect this in immobile or cognitively impaired individuals, especially with overflow diarrhea. Management may require manual disimpaction followed by oral PEG.</li>
              <li><strong>Dementia:</strong> Prevention is the primary strategy. Use non-verbal cues (fidgeting, pacing), timed toileting (30 mins after meals), and consider regular osmotic laxatives.</li>
              <li><strong>Parkinson's Disease:</strong> Constipation is very common due to dyssynergic defecation and medications. Standard treatment with fibre and laxatives applies.</li>
              <li><strong>Post-Stroke:</strong> Constipation occurs in 30-60% of patients. It's associated with increased dependency and poor outcomes. Abdominal massage may be effective.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
