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
          Based on work by Katherine T Ward, MD and David B Reuben, MD.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Geriatric conditions such as functional impairment and dementia are
            common and frequently unrecognized or inadequately addressed in older
            adults. Identifying geriatric conditions by performing a geriatric
            assessment can help clinicians manage these conditions and prevent
            or delay their complications.
          </p>
          <p>
            "Geriatric syndrome" is a term that is often used to refer to common
            health conditions in older adults that do not fit into distinct
            organ-based disease categories and often have multifactorial causes.
            The list includes conditions such as cognitive impairment, delirium,
            incontinence, malnutrition, falls, gait disorders, pressure ulcers,
            sleep disorders, sensory deficits, fatigue, dizziness, and frailty.
            These conditions are common in older adults, and they may have a
            major impact on quality of life and disability. Geriatric syndromes
            can best be identified by a geriatric assessment.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Comprehensive geriatric assessment (CGA) is defined as a
            multidisciplinary diagnostic and treatment process that identifies
            medical, psychosocial, and functional limitations of a frail older
            person in order to develop a coordinated plan to maximize overall
            health with aging. The health care of an older adult extends beyond
            the traditional medical management of illness. It requires evaluation
            of multiple issues, including physical, cognitive, affective, social,
            financial, environmental, and spiritual components that influence an
            older adult's health.
          </p>
          <p>
            CGA is based on the premise that a systematic evaluation of frail,
            older persons by a team of health professionals may identify a
            variety of treatable medical and social problems and lead to better
            health outcomes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indications for Referral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The best evidence for comprehensive geriatric assessment (CGA) is
            based on identifying appropriate patients (ie, excluding patients who
            are either too well or are too sick to derive benefit). Specific
            criteria used by CGA programs to identify patients include:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Age</li>
            <li>Medical comorbidities such as heart failure or cancer</li>
            <li>Psychosocial disorders such as depression or isolation</li>
            <li>
              Specific geriatric conditions such as dementia, falls, functional
              disability, or frailty
            </li>
            <li>Previous or predicted high health care utilization</li>
            <li>
              Consideration of change in living situation (eg, from independent
              living to assisted living, nursing home, or in-home caregivers)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Major Components of CGA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-headline text-xl font-semibold">
              Functional Status
            </h3>
            <p className="mt-2 text-muted-foreground">
              Functional status refers to the ability to perform activities
              necessary or desirable in daily life. It's influenced by health,
              environment, and social support.
            </p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Basic Activities of Daily Living (BADLs):</strong>{' '}
                Self-care tasks like bathing, dressing, eating, and moving
                around.
              </p>
              <p>
                <strong>
                  Instrumental Activities of Daily Living (IADLs):
                </strong>{' '}
                Tasks for maintaining an independent household, like shopping,
                cooking, managing medications, and handling finances.
              </p>
              <p>
                <strong>Advanced Activities of Daily Living (AADLs):</strong>{' '}
                Fulfilling societal, community, and family roles, plus
                recreational activities.
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">
              Falls/Imbalance
            </h3>
            <p className="mt-2 text-muted-foreground">
              About one-third of people over 65 fall each year. A fall risk
              assessment is crucial for all geriatric patients.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">Cognition</h3>
            <p className="mt-2 text-muted-foreground">
              Dementia is common in older adults but often undiagnosed. Early
              diagnosis helps in finding treatable conditions and planning for
              the future.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">Mood</h3>
            <p className="mt-2 text-muted-foreground">
              Depression is a serious, yet underdiagnosed, issue in older
              adults. It can present atypically, especially with cognitive
              impairment. A simple two-question screen can help identify those
              at risk.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">
              Polypharmacy
            </h3>
            <p className="mt-2 text-muted-foreground">
              Older adults often take multiple medications, increasing the risk
              of adverse effects. It's vital to review all medications,
              including over-the-counter drugs and supplements, at every visit.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">
              Social and Financial Support
            </h3>
            <p className="mt-2 text-muted-foreground">
              A strong support network is often key to an older adult remaining
              at home. Assess who is available to help and screen caregivers for
              burnout. Financial situations are also important for accessing
              care.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">
              Goals of Care & Advance Preferences
            </h3>
            <p className="mt-2 text-muted-foreground">
              Discuss what outcomes are most important to the patient and their
              family. These goals are often social or functional, not just
              medical. It's also critical to discuss preferences for future
              medical treatments and appoint a decision-maker while the patient
              can still participate.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Information Gathering Tools</CardTitle>
          <CardDescription>
            A pre-visit questionnaire can save time and gather a large amount of information.
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
                <TableCell>Questions about ADLs and IADLs; Vulnerable Elders Scale-13 (VES-13); Clinical Frailty Scale.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mobility/Gait</TableCell>
                <TableCell>"Timed Up and Go" test; Gait speed measurement.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Falls</TableCell>
                <TableCell>"Have you fallen in the past year? How many times? Were you injured?"</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cognition</TableCell>
                <TableCell>Mini-Cog; Montreal Cognitive Assessment (MoCA).</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mood</TableCell>
                <TableCell>Two-question screen; Patient Health Questionnaire-9 (PHQ-9).</TableCell>
              </TableRow>
               <TableRow>
                <TableCell>Nutrition</TableCell>
                <TableCell>"Have you lost more than 10 pounds in the past six months without trying?"</TableCell>
              </TableRow>
               <TableRow>
                <TableCell>Vision/Hearing</TableCell>
                <TableCell>Self-reported difficulty; Whisper test; Snellen eye chart.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
