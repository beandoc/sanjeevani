
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

export default function ImplementationPage() {
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
          <CardTitle className="text-3xl font-bold font-headline">Models for Implementation</CardTitle>
          <CardDescription>Different models exist for implementing geriatric assessment in oncology, each with advantages and disadvantages.</CardDescription>
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
                <TableCell>A specific ward with a specialized team applying the GA, based on Geriatric Evaluation and Management Unit (GEMU) or Acute Care for Elders (ACE) models.</TableCell>
                <TableCell>Centralization of expertise and integrated treatment.</TableCell>
                <TableCell>Limited patient reach; potential for oncologists not to refer; may not be financially feasible for all centers.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Geriatric Consultation Team (GCT)</TableCell>
                <TableCell>A specialized geriatric team provides GA on a consultative basis in non-GA wards or other clinical settings.</TableCell>
                <TableCell>Can reach a large majority of older patients; fosters interaction and cross-education between oncology and geriatric teams.</TableCell>
                <TableCell>Logistical and staffing challenges; potential for low compliance with recommendations if not well-integrated.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Embedded or Integrated Model</TableCell>
                <TableCell>GA is performed within the oncology clinic, often by a nurse or advanced practice provider, with high-risk patients referred to off-site geriatricians or specialists as needed.</TableCell>
                <TableCell>Can reach many patients; uses validated screening methods to target high-risk individuals; practical for settings without on-site geriatricians.</TableCell>
                <TableCell>Difficult to achieve deep interaction between teams; potential for long waiting lists for external referrals; requires dedicated oncology staff.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
           <p className="mt-6 text-sm text-muted-foreground">
              The choice of model depends on the local healthcare structure, available resources, and patient population. The most important factor is creating a process that ensures assessment findings are integrated into the patient's care plan and lead to meaningful interventions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
