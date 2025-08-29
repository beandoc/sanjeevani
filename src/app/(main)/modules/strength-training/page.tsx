
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Dumbbell, HeartPulse, Bone, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StrengthTrainingPage() {
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
          Strength Training: A Powerful Tool for Health
        </h1>
        <p className="text-muted-foreground">
          Understanding the benefits and principles of strength training for adults of all ages.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-primary" />
              What is Strength Training?
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>The Basics of Strength</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Muscular strength is the ability to produce force against resistance. This is crucial for nearly every fitness attribute, including power, balance, speed, and endurance. Strong muscles protect against injury, frailty, and falls, helping to maintain independence.
                </p>
                <p>
                  Strength training is a planned program of exercises designed to increase this ability. It's not about random workouts, but about careful, progressive challenges over time. The key principle is <strong>progressive overload</strong>: gradually increasing the difficulty to stimulate adaptation and get stronger. Recovery, through proper nutrition and sleep, is just as important as the exercise itself.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              The Many Benefits of Strength Training
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Improved Body Composition:</strong> Increases lean muscle mass and decreases body fat, especially harmful visceral fat.
                </li>
                <li>
                    <strong>Better Metabolic Health:</strong> Improves how the body uses sugar, increasing insulin sensitivity and helping to prevent or manage type 2 diabetes.
                </li>
                <li>
                    <strong>Stronger Bones:</strong> Stimulates bone growth and can improve bone mineral density, reducing the risk of osteoporosis.
                </li>
                <li>
                    <strong>Enhanced Functional Strength:</strong> Makes daily activities like carrying groceries, climbing stairs, and getting up from a chair easier and safer.
                </li>
                 <li>
                    <strong>Reduced Mortality Risk:</strong> Studies show a strong link between muscular strength and a longer, healthier life, with a lower risk of death from all causes, including cardiovascular disease and cancer.
                </li>
                <li>
                    <strong>Mental Health Boost:</strong> Can reduce symptoms of depression and anxiety, and improve sleep quality and overall psychosocial health.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Strength Training for Specific Medical Conditions
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>Strength training can be a powerful tool in managing many chronic diseases:</p>
            <ul className="list-disc space-y-4 pl-5">
              <li>
                <strong className="font-semibold text-card-foreground">Metabolic Health (Obesity, Diabetes):</strong> By building muscle, the body has more space to store glucose, which improves blood sugar control. It helps preserve muscle during weight loss and can reduce abdominal fat.
              </li>
              <li>
                <strong className="font-semibold text-card-foreground">Cardiovascular Health (Heart Disease, Hypertension):</strong> It can lower blood pressure, improve cholesterol profiles, and is beneficial for patients with stable coronary artery disease and even chronic heart failure.
              </li>
              <li>
                <strong className="font-semibold text-card-foreground">Musculoskeletal Health (Sarcopenia, Osteoarthritis, Back Pain):</strong> It's the most effective way to combat age-related muscle loss (sarcopenia). For osteoarthritis, strengthening the muscles around an affected joint can reduce pain and improve function. It can also alleviate chronic low back pain by strengthening the entire body.
              </li>
              <li>
                <strong className="font-semibold text-card-foreground">Other Conditions:</strong> Emerging evidence shows benefits for conditions like chronic kidney disease (CKD), metabolic liver disease (MASLD), COPD, rheumatoid arthritis, and even in recovery from stroke.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Understanding the Risks
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>
              When done correctly, strength training is extremely safe. Most injuries are due to poor technique or trying to do too much, too soon.
            </p>
             <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Musculoskeletal Injury:</strong> The risk of strains or sprains is low with proper form and gradual progression. Most injuries are minor and heal quickly.
                </li>
                <li>
                    <strong>Cardiovascular Events:</strong> For those with known or occult heart disease, any vigorous exercise carries a small, temporary risk. Patients with stable heart conditions benefit greatly, but those with unstable symptoms should seek medical attention before exercising.
                </li>
                <li>
                    <strong>Rhabdomyolysis:</strong> This is a rare but serious condition where muscle breaks down rapidly. It's caused by extreme exertion far beyond one's fitness level. It can be avoided by starting slowly, progressing gradually, and staying hydrated.
                </li>
                 <li>
                    <strong>Special Populations:</strong> Patients with conditions like uncontrolled hypertension, advanced diabetic retinopathy, or recent aortic dissection should consult with their doctor to determine safe exercise modifications.
                </li>
            </ul>
            <p className="mt-4 font-semibold text-card-foreground">
                The key to safety is starting with a manageable weight, focusing on good form, and increasing the challenge slowly and progressively over time.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
