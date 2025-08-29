
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Brain, Shield, Home, MessageSquare, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StrokeRehabModulePage() {
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
          Stroke Rehabilitation: A Guide for Caregivers
        </h1>
        <p className="text-muted-foreground">
          This module provides essential information for supporting a loved one's recovery after a stroke.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Understanding Stroke and Its Effects
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>What Happens After a Stroke</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  A stroke can impact many functions, including movement, speech, and thinking. Recovery is a unique journey for each person and requires patience and consistent support.
                </p>
                <h4 className="font-semibold">Common Post-Stroke Challenges:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Physical Changes:</strong> Weakness or paralysis on one side of the body (hemiparesis), difficulty with balance and coordination.
                  </li>
                  <li>
                    <strong>Cognitive Changes:</strong> Problems with memory, attention, and problem-solving.
                  </li>
                  <li>
                    <strong>Communication Issues:</strong> Difficulty speaking (aphasia) or understanding speech.
                  </li>
                  <li>
                    <strong>Emotional Changes:</strong> Depression, anxiety, and frustration are common during recovery.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Supporting Physical Recovery
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Helping with Mobility and Daily Activities</CardTitle>
              </Header>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Encourage Movement:</strong> Assist with exercises recommended by physical and occupational therapists to regain strength and coordination.
                    </li>
                    <li>
                        <strong>Safe Transfers:</strong> Learn the proper techniques for helping your loved one move from a bed to a chair or wheelchair to prevent falls.
                    </li>
                    <li>
                        <strong>Activities of Daily Living (ADLs):</strong> Be patient and provide assistance with tasks like dressing, bathing, and eating. Encourage them to do as much as they can for themselves to build independence.
                    </li>
                    <li>
                        <strong>Use of Assistive Devices:</strong> Ensure walkers, canes, or braces are used correctly as advised by therapists.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              Managing Communication and Cognitive Changes
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Strategies for Effective Interaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Be Patient:</strong> Give your loved one time to find their words. Avoid finishing their sentences unless they ask for help.
                    </li>
                    <li>
                        <strong>Simplify Communication:</strong> Use simple, direct sentences and ask yes-or-no questions. Use gestures or draw pictures to aid understanding.
                    </li>
                    <li>
                        <strong>Reduce Distractions:</strong> Talk in a quiet environment to help them focus.
                    </li>
                    <li>
                        <strong>Memory Aids:</strong> Use calendars, lists, and pill organizers to help with memory and daily routines.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Home className="h-6 w-6 text-primary" />
              Creating a Safe Home Environment
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Adapting the Home for Safety and Independence</CardTitle>
              </Header>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Fall Prevention:</strong> Remove throw rugs, clear walkways, and ensure good lighting.
                    </li>
                    <li>
                        <strong>Bathroom Safety:</strong> Install grab bars, a shower seat, and non-slip mats.
                    </li>
                    <li>
                        <strong>Accessibility:</strong> Keep frequently used items within easy reach.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Preventing Complications and Future Strokes
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Long-Term Health Management</CardTitle>
              </Header>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Medication Management:</strong> Ensure medications are taken exactly as prescribed to manage blood pressure, cholesterol, and other risk factors.
                    </li>
                    <li>
                        <strong>Healthy Lifestyle:</strong> Support a heart-healthy diet, encourage gentle physical activity as approved by the doctor, and help them to quit smoking.
                    </li>
                    <li>
                        <strong>Know the Signs of Stroke:</strong> Be aware of the F.A.S.T. signs (Face drooping, Arm weakness, Speech difficulty, Time to call emergency services) and seek immediate medical help if they occur.
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
