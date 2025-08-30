
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HeartPulse, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HypertensionCaregiverPage() {
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
          High Blood Pressure in Your Loved One: A Caregiver's Guide
        </h1>
        <p className="text-muted-foreground">
          Learn to manage high blood pressure safely with a focus on quality of life.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              Why is High Blood Pressure so Common in Seniors?
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Understanding "Stiff Arteries"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  As we get older, our blood vessels naturally change. Think of them like a garden hose: when new, it's flexible and springy. After years in the sun, it becomes stiff and less pliable. This stiffness forces the pressure of the blood to go up. This is why the top number (systolic) of the blood pressure reading is often high, while the bottom number might be normal or even low.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Safety First: The Risks of Treatment
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Awareness is Crucial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>While lowering blood pressure is important, the treatment itself can carry risks. Your awareness is a crucial safety measure.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Falls are a Major Concern:</strong> Blood pressure medications can cause dizziness, lightheadedness, and an increased risk of serious falls.
                    </li>
                    <li>
                        <strong>The First Month is Critical:</strong> The danger of falling is highest in the first 30 to 45 days after your loved one starts a new blood pressure medicine or increases the dose. Watch them closely for any signs of dizziness.
                    </li>
                    <li>
                        <strong>Dizziness When Standing Up:</strong> If your loved one feels faint or "woozy" right after standing up, this is called orthostatic hypotension. It is a significant fall risk. Report this to their doctor immediately.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Why "Lower Isn't Always Better"
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>The Goal is Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  You might hear about very low blood pressure targets, but these don't apply to everyone. For older adults, especially those who are frail, the goal is about balance. A safer goal might be under 140/90 or even 150/90.
                </p>
                <p>
                  The reason for a relaxed goal is simple: to prioritize safety and quality of life. For a frail person, the harm from a fall caused by low blood pressure can be far worse than the long-term risk of a slightly higher reading.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              How You Can Help
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>You Are a Vital Team Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Support a Healthy Lifestyle:</strong> Encourage daily walks, help prepare low-sodium meals, and support them in quitting smoking or reducing alcohol.
                    </li>
                    <li>
                        <strong>Communicate with the Doctor:</strong> Bring an updated list of all medications to every appointment. Report any falls, dizziness, or new confusion.
                    </li>
                    <li>
                        <strong>Ask Questions:</strong> "What is our blood pressure goal?" and "What side effects should I watch for?" are great places to start.
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
