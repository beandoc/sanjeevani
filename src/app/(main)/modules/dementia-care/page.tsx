
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Brain, MessageSquare, ShieldAlert, Home, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DementiaCareModulePage() {
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
          Dementia Care: A Guide for Caregivers
        </h1>
        <p className="text-muted-foreground">
          This module offers guidance on how to provide effective and compassionate care for a person with dementia.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Understanding Dementia
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>What is Dementia?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Dementia is not a specific disease but a general term for a decline in mental ability severe enough to interfere with daily life. Alzheimer's disease is the most common type. Dementia affects memory, thinking, and social abilities.
                </p>
                <h4 className="font-semibold">Key Characteristics:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Progressive Nature:</strong> Symptoms start out slowly and gradually get worse.
                  </li>
                  <li>
                    <strong>Memory Loss:</strong> Particularly difficulty remembering recent events.
                  </li>
                  <li>
                    <strong>Cognitive Deficits:</strong> Challenges with language, problem-solving, and other thinking skills.
                  </li>
                   <li>
                    <strong>Behavioral Changes:</strong> Personality changes, mood swings, and loss of initiative.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              Communication Strategies
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Connecting and Communicating Effectively</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Be Patient and Calm:</strong> Speak slowly and clearly in a reassuring tone.
                    </li>
                    <li>
                        <strong>Use Simple Language:</strong> Use short sentences and familiar words. Ask one question at a time.
                    </li>
                    <li>
                        <strong>Listen Actively:</strong> Pay attention to their tone and body language. Try to understand the feelings behind their words.
                    </li>
                    <li>
                        <strong>Avoid Arguing:</strong> Don't correct them if they say something that isn't true. Instead, respond to the emotion, validate their feelings, and gently redirect.
                    </li>
                     <li>
                        <strong>Use Non-Verbal Cues:</strong> Make eye contact, smile, and use gentle touch to convey your message and provide comfort.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-primary" />
              Managing Challenging Behaviors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Responding with Compassion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Challenging behaviors like agitation, aggression, or wandering are often a form of communication, indicating an unmet need or distress.
                </p>
                <h4 className="font-semibold">Strategies for Responding:</h4>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Identify the Trigger:</strong> Look for patterns. Is the behavior caused by pain, hunger, thirst, a need to use the toilet, or overstimulation?
                    </li>
                    <li>
                        <strong>Stay Calm and Reassure:</strong> Do not get angry or frustrated. Use a calm voice to reassure them that they are safe.
                    </li>
                    <li>
                        <strong>Redirect and Distract:</strong> Gently try to change the subject or suggest a new activity, like listening to music, looking at photos, or going for a walk.
                    </li>
                    <li>
                        <strong>Validate their Reality:</strong> If they are looking for a deceased loved one, saying "You must miss them very much" is more helpful than "They died years ago."
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
              Creating a Safe and Supportive Environment
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Adapting the Home</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Reduce Clutter:</strong> A simplified, uncluttered space reduces confusion and the risk of falls.
                    </li>
                    <li>
                        <strong>Improve Lighting:</strong> Ensure good lighting to reduce disorientation and prevent accidents. Use nightlights.
                    </li>
                    <li>
                        <strong>Secure the Home:</strong> Use locks on doors and windows to prevent wandering. Consider a medical alert system or GPS tracking device.
                    </li>
                     <li>
                        <strong>Remove Hazards:</strong> Lock away medications, cleaning supplies, and sharp objects.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Meaningful Activities and Daily Routines
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Promoting Engagement and Purpose</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>A predictable routine can reduce stress and anxiety. Meaningful activities can enhance mood and quality of life.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Establish a Simple Routine:</strong> Try to keep meal times, wake-up times, and bedtimes consistent.
                    </li>
                    <li>
                        <strong>Focus on Enjoyable Activities:</strong> Tailor activities to their interests and abilities. This could include listening to music, gardening, folding laundry, looking at photo albums, or doing simple puzzles.
                    </li>
                    <li>
                        <strong>Encourage Movement:</strong> Gentle exercise like walking or seated stretching can improve physical and mental well-being.
                    </li>
                    <li>
                        <strong>Break Down Tasks:</strong> Break down complex tasks into small, manageable steps to promote a sense of accomplishment.
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
