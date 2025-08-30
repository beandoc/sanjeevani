
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Shield, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OralHealthProfessionalPage() {
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
          Geriatric Oral Health for Health Professionals
        </h1>
        <p className="text-muted-foreground">
          A review of oral health screening, common challenges, and interprofessional care for clinicians.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Screening, Systemic Links, and Medication Effects
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrating Oral Health into the Physical Exam</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Oral health screening should be a routine part of the initial history and physical examination. Disease in the oral cavity can significantly diminish a patient's overall health and quality of life.
                </p>
                <h4 className="font-semibold">Key Considerations:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Systemic Links:</strong> Be aware of the bidirectional relationship between oral health and systemic conditions. For example, poor glycemic control in diabetes increases the risk for periodontal disease, and severe periodontal disease can worsen glycemic control.
                  </li>
                  <li>
                    <strong>Medication Adverse Effects:</strong> Many common medications (e.g., anticholinergics, diuretics, antidepressants) cause xerostomia (dry mouth), which dramatically increases the risk for dental caries and candidiasis.
                  </li>
                  <li>
                    <strong>Functional Limitations:</strong> Assess the patient's ability to perform their own oral hygiene. Frailty, cognitive impairment, or poor manual dexterity are significant barriers to effective daily care.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              Interprofessional Care and Referral
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Team-Based Approach and Referral Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Ensuring good oral health, especially in long-term care or for homebound patients, requires an interprofessional team approach that includes physicians, nurses, caregivers, and oral health professionals (dentists, hygienists).</p>
                 <h4 className="font-semibold">Key Referral Criteria:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Evidence of pain, infection, or significant inflammation (e.g., abscess, severe gingivitis).</li>
                    <li>Broken or ill-fitting prostheses (dentures).</li>
                    <li>Suspicious lesions or sores that have not healed within two weeks.</li>
                    <li>Patient-reported difficulty chewing or swallowing.</li>
                    <li>Significant dental caries or loose teeth identified during screening.</li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">For frail homebound patients, challenges include mobility to get to a dental office. Collaboration with mobile dentistry services or dentists with specialized training in geriatrics is often necessary.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Preventive Care Strategies
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Proactive Oral Health Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>A preventive model is crucial for maintaining oral health in older adults.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Fluoride Application:</strong> Prescription-strength fluoride toothpastes, gels, or professionally applied fluoride varnishes are highly effective at preventing caries, especially root caries.
                    </li>
                    <li>
                        <strong>Antibacterial Rinses:</strong> Chlorhexidine gluconate rinses can help manage plaque and gingivitis, but should be used judiciously to avoid staining.
                    </li>
                    <li>
                        <strong>Adaptive Equipment:</strong> Recommend electric toothbrushes for patients with limited dexterity. For interdental cleaning, suggest floss holders, threaders, or interdental brushes.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
