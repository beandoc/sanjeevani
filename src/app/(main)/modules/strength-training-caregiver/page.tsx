
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HeartPulse, Dumbbell, Smile, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StrengthTrainingCaregiverPage() {
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
          Supporting Physical Activity: A Caregiver's Guide
        </h1>
        <p className="text-muted-foreground">
          Learn how to encourage exercise and physical fitness for older adults.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              Why Activity Matters
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Small Efforts, Big Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Regular physical activity is one of the most powerful things an older adult can do for their health. It can improve everything from heart health to mood, and it's essential for maintaining independence.
                </p>
                <p>
                  It's helpful to know the difference between "physical activity" (like gardening or chores) and "exercise" (a planned workout). Both are important! Your role as a caregiver is to encourage both in a safe and supportive way.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-primary" />
              The Core Four Types of Exercise
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
                <CardHeader>
                    <CardTitle>A Well-Rounded Routine</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                 <p>A good fitness program includes four key types of exercise. Encourage your loved one to try and include all four in their weekly routine.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Strength:</strong> Helps with daily tasks like carrying groceries or getting out of a chair. This can be done with resistance bands, light weights, or even just body weight.
                    </li>
                    <li>
                        <strong>Balance:</strong> Crucial for preventing falls. Simple activities like standing on one leg or walking heel-to-toe can make a big difference.
                    </li>
                    <li>
                        <strong>Aerobic (Cardio):</strong> Important for heart health and stamina. Brisk walking, swimming, or cycling are great options.
                    </li>
                    <li>
                        <strong>Flexibility:</strong> Gentle stretching helps reduce stiffness and improves range of motion.
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
              Exercise as Medicine
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>More Than Just Physical Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Think of exercise as a powerful "medication" with only positive side effects. It can be more effective than drugs for some conditions and is especially helpful for issues that don't have a cure.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Mood Booster:</strong> Exercise is a proven way to reduce symptoms of depression and anxiety.
                    </li>
                    <li>
                        <strong>Pain Relief:</strong> For conditions like arthritis, strengthening the muscles around a joint can significantly reduce pain.
                    </li>
                    <li>
                        <strong>Brain Health:</strong> Physical activity is one of the best things for brain health and can help with cognitive decline.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              Make it Fun and Social
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Tips for Staying Motivated</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>The hardest part of exercise is sticking with it. Your encouragement can make a huge difference.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Find Enjoyable Activities:</strong> What do they like to do? Dancing, gardening, walking in a park? Focus on activities that bring them joy.
                    </li>
                    <li>
                        <strong>Exercise Together:</strong> Go for walks together or do a gentle exercise video at home. Your participation is a great motivator.
                    </li>
                    <li>
                        <strong>Look for Group Classes:</strong> Many senior centers offer group fitness classes like tai chi or chair yoga. This adds a social element that can be very powerful.
                    </li>
                     <li>
                        <strong>Celebrate Small Wins:</strong> Acknowledge their effort and consistency. Celebrate their progress, no matter how small it seems.
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
