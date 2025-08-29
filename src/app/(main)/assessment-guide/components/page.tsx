
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
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ComponentsPage() {
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
          <CardTitle className="text-3xl font-bold font-headline">Core Components & Tools</CardTitle>
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
                <TableCell>Brief Fatigue Inventory, visual analog scales</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Polypharmacy</TableCell>
                <TableCell>Medication review, Beers Criteria, STOPP/START criteria</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Geriatric Syndromes</TableCell>
                <TableCell>Assessment for falls, delirium, incontinence, pressure ulcers, sarcopenia, etc.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
