
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Brain, Pill, Activity, Smile, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ParkinsonismCareModulePage() {
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
          Parkinsonism Care: A Guide for Caregivers
        </h1>
        <p className="text-muted-foreground">
          This module provides guidance on supporting a loved one with Parkinson's disease or other forms of parkinsonism.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Understanding Parkinsonism
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>What is Parkinsonism?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Parkinsonism is a general term for a group of neurological disorders that cause movement problems similar to those seen in Parkinson's disease, such as tremors, slow movement, and stiffness. Parkinson's disease is the most common cause.
                </p>
                <h4 className="font-semibold">Key Motor (Movement) Symptoms:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Tremor:</strong> Shaking, often in a hand or fingers, that is most prominent at rest.
                  </li>
                  <li>
                    <strong>Bradykinesia (Slowed Movement):</strong> Difficulty initiating movement, making simple tasks time-consuming and difficult.
                  </li>
                  <li>
                    <strong>Rigidity:</strong> Stiffness in the limbs, neck, or trunk, which can be painful and limit range of motion.
                  </li>
                   <li>
                    <strong>Postural Instability:</strong> Impaired balance and coordination, which can lead to falls.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Medication Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>The Importance of Timing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Medications for Parkinson's are the primary way to manage symptoms, but they must be managed carefully.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Strict Timing:</strong> Medications must be taken at the same time every day to maintain a consistent level in the body. Being even 30 minutes late can cause a sudden worsening of symptoms ("off" period).
                    </li>
                    <li>
                        <strong>Keep a Schedule:</strong> Use pill organizers and alarms to ensure doses are not missed. Keep a detailed medication log.
                    </li>
                    <li>
                        <strong>"On-Off" Fluctuations:</strong> Be aware of periods when the medication is working well ("on" time) versus when it wears off ("off" time). Report these fluctuations to the doctor.
                    </li>
                    <li>
                        <strong>Side Effects:</strong> Be observant of side effects, such as dizziness, nausea, confusion, or involuntary movements (dyskinesia), and report them to the healthcare team.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Smile className="h-6 w-6 text-primary" />
              Managing Non-Motor Symptoms
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>It's More Than Movement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Non-motor symptoms can be just as disabling as motor symptoms.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Depression and Anxiety:</strong> These are very common. Encourage social engagement and activities they enjoy. Discuss mood changes with the doctor.
                    </li>
                    <li>
                        <strong>Sleep Problems:</strong> Difficulty sleeping, acting out dreams, and daytime sleepiness are common. Establish a regular sleep routine and create a restful environment.
                    </li>
                    <li>
                        <strong>Cognitive Changes:</strong> Problems with thinking, planning, and memory can occur, especially in later stages. Use calendars, lists, and simple routines to help.
                    </li>
                    <li>
                        <strong>Constipation:</strong> This is a very common issue. Encourage fluid intake, a high-fiber diet, and physical activity.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              The Role of Therapy and Exercise
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Staying Active and Engaged</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Physical Therapy:</strong> Can help with balance, gait, and largescale movements.
                    </li>
                    <li>
                        <strong>Occupational Therapy:</strong> Helps find new ways to perform daily tasks like dressing, eating, and writing.
                    </li>
                    <li>
                        <strong>Speech Therapy:</strong> Can help with soft voice, swallowing problems, and communication.
                    </li>
                     <li>
                        <strong>Exercise:</strong> Regular exercise is crucial. Activities like walking, swimming, tai chi, and dancing can improve mobility, balance, and mood.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              Supporting Daily Life and Yourself
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Practical Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Home Safety:</strong> Prevent falls by removing hazards like throw rugs, improving lighting, and installing grab bars.
                    </li>
                    <li>
                        <strong>Patience and Encouragement:</strong> Allow extra time for tasks. Encourage independence as much as possible, but be ready to assist.
                    </li>
                    <li>
                        <strong>Care for the Caregiver:</strong> Supporting someone with Parkinson's is demanding. Seek support for yourself through support groups, take breaks, and don't hesitate to ask for help.
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
