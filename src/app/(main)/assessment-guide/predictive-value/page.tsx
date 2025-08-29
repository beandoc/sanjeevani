
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PredictiveValuePage() {
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
            Predictive Value & Impact
          </CardTitle>
          <CardDescription>
            How GA findings predict complications and influence survival and treatment decisions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Predicting Treatment Complications
            </h3>
            <p>
              Geriatric assessment can predict severe treatment-related toxicity, postoperative complications, and functional decline. Factors most consistently associated with chemotherapy toxicity are a patient's functional status and existing comorbidities. Other identified risk factors include cognitive problems, lack of social support, hearing difficulties, a history of falls, and poor nutritional status. This predictive power allows oncology teams to anticipate and mitigate risks.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Predicting Overall Survival
            </h3>
            <p>
              GA items have been shown to independently predict overall survival. The factors most consistently associated with survival are functional status, nutritional status, overall fitness, and mental health. Poorer survival in patients with deficits in these areas may be due to non-cancer related deaths, the selection of less aggressive cancer treatments, or death resulting from treatment complications.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <CheckCircle className="h-5 w-5 text-primary" />
              Impact on Treatment Decisions
            </h3>
            <p>
              GA significantly influences oncology treatment decisions, often leading to changes in the recommended treatment intensity—sometimes decreasing it, and other times increasing it. It provides a more complete picture of the patient's health, which can reveal that a patient is more (or less) robust than their chronological age might suggest. Furthermore, it allows for pretreatment optimization by identifying and addressing remediable problems before cancer treatment begins.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
