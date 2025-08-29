
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, Activity, Pill, Bone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function JointProblemsProfessionalPage() {
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
          Clinical Management of Rheumatic Disorders in Older Adults
        </h1>
        <p className="text-muted-foreground">
          A review of the assessment and management of common joint diseases like OA, RA, and Gout.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Pathophysiology and Key Risk Factors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Osteoarthritis (OA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Advanced age is the most important risk factor. Cartilage loss is the hallmark pathology, accompanied by synovial inflammation, osteophyte formation, and subchondral bone sclerosis. Other risk factors include obesity, female gender, trauma/joint injury, and quadriceps weakness.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gout and Pseudogout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Gout is an inflammatory reaction to monosodium urate (MSU) crystals associated with hyperuricemia. Risk factors include age, male gender, renal disease, alcohol use, and diuretic use. Pseudogout is a similar reaction to calcium pyrophosphate dehydrate (CPPD) crystals, with advanced age being the most critical risk factor.
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Rheumatoid Arthritis (RA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Late-onset RA differs from young-onset, with more proximal joint involvement and a more aggressive course. The characteristic pathology is synovial inflammation (pannus formation) that erodes cartilage and bone.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Assessment and Differential Diagnosis
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clinical Distinctions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Osteoarthritis:</strong> Insidious onset, chronic course. Affects DIPs (Heberden nodes), PIPs (Bouchard nodes), hips, knees. X-rays show joint space narrowing and osteophytes. Labs (ANA, RF, ESR) are typically negative.
                    </li>
                    <li>
                        <strong>Rheumatoid Arthritis:</strong> More acute/subacute onset. Often involves proximal joints. Labs may show positive RF/anti-CCP and elevated ESR/CRP. X-rays can show erosions.
                    </li>
                    <li>
                        <strong>Gout:</strong> Acute, intermittent attacks. Classically affects the first MTP. Confirmed by negatively birefringent, needle-shaped MSU crystals in synovial fluid.
                    </li>
                    <li>
                        <strong>Pseudogout:</strong> Acute, intermittent attacks, often affecting the knee or wrist. Confirmed by positively birefringent, rod-shaped CPPD crystals. X-rays may show chondrocalcinosis.
                    </li>
                    <li>
                        <strong>Polymyalgia Rheumatica (PMR):</strong> Acute onset of pain/stiffness in shoulder and hip girdles. Markedly elevated ESR/CRP. Must screen for Giant-Cell Arteritis (GCA).
                    </li>
                </ul>
                <p className="font-bold">The Role of Arthrocentesis: Joint fluid analysis is crucial to differentiate inflammatory vs. noninflammatory arthritis and to rule out septic arthritis. A WBC count &gt;2,000 indicates inflammation.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Pharmacological Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
              <h4 className="font-semibold text-lg">Osteoarthritis (OA)</h4>
              <ul className="list-disc space-y-2 pl-5">
                  <li><strong>First-Line:</strong> Topical NSAIDs are preferred over oral due to better safety profile. Acetaminophen can be trialed.</li>
                  <li><strong>Oral NSAIDs:</strong> Discouraged due to CV, GI, and renal toxicity. Use lowest effective dose for shortest duration if necessary.</li>
                  <li><strong>Intra-articular Steroids:</strong> Can provide moderate short-term pain relief for knee OA.</li>
                  <li><strong>Opioids:</strong> Not effective for pain or function and best avoided due to significant adverse effects.</li>
              </ul>

              <h4 className="font-semibold text-lg mt-4">Gout</h4>
               <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Urate-Lowering Therapy (ULT):</strong> Indicated for ≥2 attacks/year or tophi. Allopurinol is first-line. Goal is serum uric acid ≤6 mg/dL.</li>
                  <li><strong>Prophylaxis:</strong> Start low-dose colchicine or steroids when initiating ULT to prevent flares.</li>
                  <li><strong>Acute Flare Management:</strong> IA steroids for 1-2 joints. For polyarticular flares, use oral colchicine or a short course of steroids. Avoid NSAIDs in most older adults.</li>
              </ul>
              
              <h4 className="font-semibold text-lg mt-4">Rheumatoid Arthritis (RA)</h4>
               <ul className="list-disc space-y-2 pl-5">
                  <li><strong>First-Line:</strong> Early referral to rheumatology for Disease-Modifying Antirheumatic Drugs (DMARDs), often triple therapy (e.g., methotrexate, hydroxychloroquine, sulfasalazine).</li>
                  <li><strong>Biologics:</strong> For patients who fail DMARDs. Require screening for TB and hepatitis before initiation.</li>
                  <li><strong>Steroids:</strong> Used as a bridge to DMARDs, but not for long-term therapy. Prophylaxis for osteoporosis is critical if used for &gt;3 months.</li>
              </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Non-Pharmacological & Team-Based Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>
              A multimodal, interprofessional approach is critical for managing arthritis in older adults.
            </p>
             <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>Education and Goal Setting:</strong> Establish realistic goals focused on pain reduction and functional improvement.
                </li>
                <li>
                    <strong>Physical & Occupational Therapy:</strong> Essential for strength training, flexibility, assistive device selection (canes, walkers), and joint protection strategies.
                </li>
                <li>
                    <strong>Weight Loss:</strong> Critically important for overweight/obese patients with OA of the knee or hip.
                </li>
                 <li>
                    <strong>Cardiovascular Risk Management:</strong> Crucial for patients with inflammatory arthritis (RA, Gout), as they have a higher risk of CV events.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
