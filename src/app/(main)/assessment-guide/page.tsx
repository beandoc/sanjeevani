
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AssessmentGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          International Society of Geriatric Oncology Consensus on Geriatric Assessment
        </h1>
        <p className="text-muted-foreground">
          A review of geriatric assessment (GA) in older patients with cancer.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="part-1">
        <AccordionItem value="part-1">
          <AccordionTrigger className="text-2xl font-semibold font-headline">
            Introduction & Rationale
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <p className="text-muted-foreground">
              More than half of patients newly diagnosed with cancer are age 65 or older. A comprehensive geriatric assessment (CGA) is a multidimensional, interdisciplinary process to determine an older person's medical, psychosocial, and functional capabilities to develop a coordinated treatment plan. This helps address the heterogeneity of the aging process, which chronologic age alone cannot capture.
            </p>
            <p>
              Important reasons to perform GA in older patients with cancer include:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Detection of unidentified problems and risks for which targeted interventions can be applied.</li>
              <li>Prediction of adverse outcomes like treatment toxicity, functional decline, and postoperative complications.</li>
              <li>Better estimation of life expectancy, considering comorbidities and general health.</li>
              <li>Guidance for appropriate cancer treatment selection to balance benefits and harms.</li>
            </ul>
             <p className="mt-4">
              GA identifies age-related problems not typically found in a routine history and physical exam in about half of older patients with cancer. Deficits are frequent across all domains, highlighting the need for a comprehensive evaluation.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="part-2">
          <AccordionTrigger className="text-2xl font-semibold font-headline">
            Predictive Value & Impact
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <h3 className="text-xl font-semibold">Predicting Complications</h3>
             <p>
              GA can predict severe treatment-related toxicity, postoperative complications, and functional decline. Factors most consistently associated with toxicity are functional status and comorbidity. Other identified risk factors include cognitive problems, lack of social support, hearing difficulties, falls, and poor nutritional status.
            </p>
             <h3 className="text-xl font-semibold mt-4">Predicting Overall Survival</h3>
            <p>
              GA items independently predict overall survival. Factors most consistently associated with survival are functional status, nutritional status, overall fitness, and mental health. Poorer survival may be due to non-cancer deaths, less aggressive cancer treatment, or treatment complications.
            </p>
             <h3 className="text-xl font-semibold mt-4">Impact on Treatment Decisions</h3>
            <p>
              GA influences oncology treatment decisions, often leading to changes in treatment intensity (either decreasing or increasing it). It allows for pretreatment patient optimization by addressing identified, remediable problems.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="part-3">
          <AccordionTrigger className="text-2xl font-semibold font-headline">
            Components & Implementation
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Core Domains & Tools</CardTitle>
                <CardDescription>A Geriatric Assessment should evaluate several key domains. Various tools are available, and the choice may depend on local preference and resources.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Common Tools</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">Functional Status</TableCell>
                      <TableCell>ADLs (Katz Index), IADLs (Lawton Scale), Timed Get Up and Go, Short Physical Performance Battery</TableCell>
                    </TableRow>
                     <TableRow>
                      <TableCell className="font-semibold">Comorbidity</TableCell>
                      <TableCell>Charlson Comorbidity Index, CIRS-G</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Cognition</TableCell>
                      <TableCell>Mini Mental State Examination (MMSE), Clock-drawing test</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Mental Health</TableCell>
                      <TableCell>Geriatric Depression Scale (GDS), Hospital Anxiety and Depression Scale</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Nutrition</TableCell>
                      <TableCell>Mini Nutritional Assessment (MNA), Weight Loss, BMI</TableCell>
                    </TableRow>
                     <TableRow>
                      <TableCell className="font-semibold">Social Status</TableCell>
                      <TableCell>Questions on living situation, caregiver burden, social support surveys</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Fatigue</TableCell>
                      <TableCell>MOB-T (Mobility Tiredness Test)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Geriatric Syndromes</TableCell>
                      <TableCell>Assessment for falls, delirium, incontinence, polypharmacy (Beers, STOPP/START), sarcopenia, etc.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

             <Card className="mt-6">
              <CardHeader>
                <CardTitle>Models for Implementation</CardTitle>
                <CardDescription>Different models exist for implementing GA in oncology, each with advantages and disadvantages.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Advantage</TableHead>
                      <TableHead>Disadvantage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">Geriatric Oncology Unit</TableCell>
                      <TableCell>A specific ward with a specialized team applying the GA, based on GEMU or ACE models.</TableCell>
                      <TableCell>Centralization of expertise and treatment options.</TableCell>
                      <TableCell>Limited patient reach; potential for oncologists not to refer.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Geriatric Consultation Team (GCT)</TableCell>
                      <TableCell>A specialized geriatric team provides GA on a consultative basis in non-GA wards or other settings.</TableCell>
                      <TableCell>Can reach a large majority of older patients; fosters interaction between oncology and geriatric teams.</TableCell>
                      <TableCell>Logistical challenges; potential for low compliance with recommendations.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">GA where Geriatric Expertise is not Nearby</TableCell>
                      <TableCell>GA is performed in standalone cancer centers, with high-risk patients referred to off-site geriatricians.</TableCell>
                      <TableCell>Can reach many patients; uses validated methods to target high-risk individuals.</TableCell>
                      <TableCell>Difficult to achieve interaction between teams; potential for long waiting lists for referrals.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
