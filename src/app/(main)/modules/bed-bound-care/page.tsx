
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Droplets, Bed, Utensils, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BedBoundCareModulePage() {
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
          Bed-Bound Patient Care: A Guide for Caregivers
        </h1>
        <p className="text-muted-foreground">
          This module provides essential guidance for providing safe, comfortable, and dignified care for someone who is confined to bed.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Preventing Pressure Sores (Bedsores)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>The Importance of Skin Care</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Pressure sores are injuries to the skin and underlying tissue resulting from prolonged pressure. They are a primary concern for bed-bound individuals.
                </p>
                <h4 className="font-semibold">Key Prevention Strategies:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Regular Repositioning:</strong> Change the person's position at least every two hours to relieve pressure. Follow a turning schedule.
                  </li>
                  <li>
                    <strong>Inspect the Skin Daily:</strong> Check the entire body, especially bony areas like the tailbone, hips, heels, and elbows, for any signs of redness or breakdown.
                  </li>
                  <li>
                    <strong>Use Pressure-Relieving Surfaces:</strong> Special mattresses, pads, and cushions can help distribute pressure more evenly.
                  </li>
                  <li>
                    <strong>Keep Skin Clean and Dry:</strong> Moisture from sweat or incontinence can increase the risk of skin breakdown.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Droplets className="h-6 w-6 text-primary" />
              Hygiene and Personal Care
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Maintaining Cleanliness and Dignity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Bed Baths:</strong> Learn the proper technique for giving a sponge bath to ensure all areas are cleaned gently and thoroughly.
                    </li>
                    <li>
                        <strong>Oral Care:</strong> Brush their teeth and care for their mouth at least twice a day to prevent infections.
                    </li>
                    <li>
                        <strong>Hair and Nail Care:</strong> Keep hair clean and combed. Trim fingernails and toenails as needed to prevent scratches and infections.
                    </li>
                    <li>
                        <strong>Managing Incontinence:</strong> If applicable, change pads or briefs promptly. Use barrier creams to protect the skin from moisture.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Mobility and Range of Motion
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Preventing Stiffness and Complications</CardTitle>
              </Header>
              <CardContent className="space-y-4">
                <p>
                  Even if a person cannot get out of bed, movement is crucial to prevent joint stiffness, muscle shortening (contractures), and blood clots.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Passive Range-of-Motion Exercises:</strong> As guided by a therapist, gently move the person's limbs through their full range of motion.
                    </li>
                    <li>
                        <strong>Encourage Active Movement:</strong> If possible, encourage them to do small movements themselves, like wiggling fingers and toes or bending their knees.
                    </li>
                    <li>
                        <strong>Proper Positioning:</strong> Use pillows to support limbs in a natural, comfortable position to prevent strain and contractures.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Utensils className="h-6 w-6 text-primary" />
              Nutrition and Hydration
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Fueling the Body for Health</CardTitle>
              </Header>
              <CardContent className="space-y-4">
                <p>Good nutrition is essential for maintaining skin integrity, fighting infection, and overall well-being.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Offer Nutrient-Dense Foods:</strong> Focus on meals rich in protein, vitamins, and minerals.
                    </li>
                    <li>
                        <strong>Ensure Adequate Hydration:</strong> Offer water and other fluids regularly throughout the day to prevent dehydration, which can cause confusion and other complications.
                    </li>
                    <li>
                        <strong>Make Mealtime Pleasant:</strong> If possible, help them sit up for meals. Make it a social and enjoyable time.
                    </li>
                    <li>
                        <strong>Assist with Feeding:</strong> If needed, be patient and allow plenty of time for them to chew and swallow safely.
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
