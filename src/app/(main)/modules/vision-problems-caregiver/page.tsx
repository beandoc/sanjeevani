
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, AlertTriangle, Glasses, Droplets } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VisionProblemsCaregiverPage() {
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
          Vision and Eye Problems: A Caregiver's Guide
        </h1>
        <p className="text-muted-foreground">
          Understanding common age-related eye conditions to better support your loved one.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Red Flags: When to See a Doctor Immediately
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Recognizing Serious Eye Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Most red eyes are not an emergency, but you should seek same-day medical attention from an eye provider if you notice any of these "red flag" symptoms:
                </p>
                <ul className="list-disc space-y-2 pl-5 font-medium text-destructive">
                  <li>Sudden decrease or loss of vision</li>
                  <li>Significant eye pain</li>
                  <li>Sensitivity to light (photophobia)</li>
                  <li>Seeing colored halos around lights</li>
                  <li>A pupil that looks different in shape or size</li>
                  <li>A white or cloudy spot on the cornea (the clear front part of the eye)</li>
                  <li>An eye that is bulging or protruding</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Droplets className="h-6 w-6 text-primary" />
              Dry Eye Disease
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>A Common and Bothersome Condition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Dry eye is very common in older adults and can cause discomfort, burning, stinging, grittiness, or even excessive tearing. Many things can contribute to it, including age, female gender, and side effects from common medications (like diuretics, antihistamines, and antidepressants).</p>
                 <h4 className="font-semibold">How You Can Help:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Use Lubricating Eye Drops:</strong> Artificial tears can provide significant relief. It's best to use preservative-free drops if they are needed more than 3-4 times a day.
                    </li>
                    <li>
                        <strong>Apply Warm Compresses:</strong> A clean, warm washcloth held over the closed eyes for a few minutes can be soothing.
                    </li>
                    <li>
                        <strong>Avoid "Redness-Reducing" Drops:</strong> Over-the-counter drops that promise to "get the red out" can make dry eye worse if used for a long time.
                    </li>
                    <li>
                        <strong>Review Medications:</strong> Ask the doctor if any current medications could be making dry eye worse.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary" />
              Common Causes of Vision Loss
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <Card>
              <CardHeader>
                <CardTitle>Cataracts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>A clouding of the eye's natural lens. It causes blurry vision, faded colors, and increased glare, especially at night. It is very common and treatable with surgery, which is safe and highly effective.</p>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>Age-Related Macular Degeneration (AMD)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>This disease affects the macula, the part of the retina responsible for sharp, central vision. It can make it difficult to read, drive, or recognize faces. A key symptom is seeing straight lines as wavy or distorted.</p>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>Glaucoma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Often called the "silent thief of sight," glaucoma damages the optic nerve, usually without symptoms in the early stages. It causes a gradual loss of peripheral (side) vision. Regular eye exams are crucial for early detection.</p>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>Diabetic Retinopathy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>A complication of diabetes that damages the blood vessels in the retina. Anyone with diabetes needs a comprehensive eye exam at least once a year to screen for this condition, even if their vision seems fine.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Glasses className="h-6 w-6 text-primary" />
              The Importance of Regular Eye Exams
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardContent className="pt-6 space-y-4">
                 <p>Many serious eye diseases are asymptomatic in their early stages. Early detection and treatment can prevent irreversible vision loss.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Screening Schedule:</strong> Older adults should have a complete, dilated eye exam every 1 to 2 years, or more frequently if they have risk factors like diabetes or glaucoma.
                    </li>
                    <li>
                        <strong>Uncorrected Refractive Error:</strong> Sometimes, vision loss is simply due to needing a new glasses prescription. This is the most common and easily correctable cause of poor vision.
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
