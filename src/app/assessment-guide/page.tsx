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
            their overall health. It goes beyond treating single diseases and
            looks at the bigger picture of what affects an older adult's
            well-being, including their social, financial, and home environment.
            This is especially important for frail individuals who are more
            vulnerable to health problems.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Core Components of Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Functional Status</h3>
          <p className="text-muted-foreground">
            How well can the person perform daily activities? This is a key
            indicator of their health and independence. We look at:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Basic Activities of Daily Living (BADLs):</strong>{' '}
              Self-care tasks like bathing, dressing, eating, and using the
              toilet.
            </li>
            <li>
              <strong>Instrumental Activities of Daily Living (IADLs):</strong>{' '}
              Tasks needed to live independently, such as shopping, cooking,
              managing money, and using the phone.
            </li>
          </ul>

          <h3 className="font-semibold text-lg">Fall Risk</h3>
          <p className="text-muted-foreground">
            Falls are common and can lead to serious injury. We assess this by
            asking about past falls and checking their balance and how they
            walk.
          </p>

          <h3 className="font-semibold text-lg">Cognition</h3>
          <p className="text-muted-foreground">
            This involves checking for memory problems or confusion (dementia).
            Early diagnosis helps in planning and finding the right support.
          </p>

          <h3 className="font-semibold text-lg">Mood</h3>
          <p className="text-muted-foreground">
            Depression is common in older adults but can be missed. We ask
            simple questions about feeling down or losing interest in
            activities to screen for it.
          </p>

          <h3 className="font-semibold text-lg">
            Polypharmacy (Multiple Medications)
          </h3>
          <p className="text-muted-foreground">
            Older adults often take many medications, which increases the risk
            of side effects and interactions. We review all medications
            (including over-the-counter ones) to ensure they are all necessary
            and safe.
          </p>

          <h3 className="font-semibold text-lg">Social and Financial Support</h3>
          <p className="text-muted-foreground">
            Having a good support system is crucial for staying at home. We ask
            who would be there to help if they got sick and look into what
            resources are available.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frailty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">What is Frailty?</h3>
          <p className="mt-2 text-muted-foreground">
            Frailty is a state of increased vulnerability to health problems. It's
            not just about age; it's a mix of weakness, low energy, and slow
            movement. Frail individuals have a higher risk of falls, hospital
            stays, and other negative outcomes.
          </p>
          <h3 className="font-semibold text-lg">What does this mean?</h3>
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
