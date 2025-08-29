
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

export default function IntroductionPage() {
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
            Introduction & Rationale
          </CardTitle>
          <CardDescription>
            Why is a geriatric assessment essential in the care of older patients with cancer?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            More than half of patients newly diagnosed with cancer are age 65 or older. A comprehensive geriatric assessment (CGA) is a multidimensional, interdisciplinary process to determine an older person's medical, psychosocial, and functional capabilities to develop a coordinated treatment plan. This helps address the heterogeneity of the aging process, which chronologic age alone cannot capture.
          </p>
          <h3 className="text-xl font-semibold">
            Key Reasons for Geriatric Assessment
          </h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Detection of Unidentified Problems:</strong> GA can uncover hidden issues and risks, allowing for targeted interventions to be applied before or during cancer treatment.
            </li>
            <li>
              <strong>Prediction of Adverse Outcomes:</strong> It helps predict adverse outcomes like severe treatment toxicity, postoperative complications, and functional decline.
            </li>
            <li>
              <strong>Better Estimation of Life Expectancy:</strong> By considering comorbidities and overall health, GA provides a more accurate picture of life expectancy, which is crucial for treatment planning.
            </li>
            <li>
              <strong>Guidance for Treatment Selection:</strong> GA is critical for guiding the appropriate selection of cancer treatments, helping to balance the potential benefits and harms for each individual patient.
            </li>
          </ul>
          <p className="mt-4">
            Ultimately, the main goal of a geriatric assessment is to provide a comprehensive health appraisal that guides both geriatric interventions and the selection of the most appropriate cancer treatment. It allows for a more personalized approach to care, moving beyond a one-size-fits-all model.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
