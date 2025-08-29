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
import Image from 'next/image';

export default function AssessmentGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Comprehensive Geriatric Assessment Guide
        </h1>
        <p className="text-muted-foreground">
          A guide for caregivers on assessing key geriatric conditions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introduction to Geriatric Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Key health issues in older adults, like problems with daily
            activities (functional impairment) or memory (dementia), are common
            but often missed. A geriatric assessment helps spot these problems
            so they can be managed early, preventing them from getting worse.
          </p>
          <p>
            A "geriatric syndrome" refers to common health problems in seniors
            that don't fit into one organ system. These include memory loss,
            delirium, incontinence, poor nutrition, falls, trouble walking,
            pressure sores, sleep issues, and frailty. These conditions can
            greatly affect quality of life and are best found through a
            geriatric assessment.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            A Comprehensive Geriatric Assessment (CGA) is a team-based process
            to check the medical, mental, and daily functioning of a frail older
            person. The goal is to create a coordinated care plan that improves
at does this mean?
          </h3>
          <p className="mt-2 text-muted-foreground">
            A diagnosis of frailty helps identify older adults who are at the
            highest risk of negative health outcomes. For these individuals,
            palliative care can help manage symptoms and guide decisions about
            medical treatments, like chemotherapy or major surgery, keeping
            their quality of life in mind.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Information Gathering Tools</CardTitle>
          <CardDescription>
            A pre-visit questionnaire can save time and gather a large amount of
            information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Screening Questions/Instruments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Functional Status</TableCell>
                <TableCell>
                  Questions about ADLs and IADLs; Vulnerable Elders Scale-13
                  (VES-13); Clinical Frailty Scale.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mobility/Gait</TableCell>
                <TableCell>
                  "Timed Up and Go" test; Gait speed measurement.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Falls</TableCell>
                <TableCell>
                  "Have you fallen in the past year? How many times? Were you
                  injured?"
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cognition</TableCell>
                <TableCell>
                  Mini-Cog; Montreal Cognitive Assessment (MoCA).
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mood</TableCell>
                <TableCell>
                  Two-question screen; Patient Health Questionnaire-9 (PHQ-9).
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nutrition</TableCell>
                <TableCell>
                  "Have you lost more than 10 pounds in the past six months
                  without trying?"
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Vision/Hearing</TableCell>
                <TableCell>
                  Self-reported difficulty; Whisper test; Snellen eye chart.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
