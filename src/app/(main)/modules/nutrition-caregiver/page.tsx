
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Utensils, Search, Brain, Handshake, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NutritionCaregiverPage() {
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
          Nutrition and Feeding: A Caregiver's Guide
        </h1>
        <p className="text-muted-foreground">
          Understanding malnutrition and feeding problems in older adults.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
              Recognizing Malnutrition
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>What is Malnutrition?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Malnutrition means an imbalance of nutrients. In older adults, it usually means "undernutrition"—not getting enough calories, protein, or other nutrients needed to keep the body healthy. It's a serious issue linked to more frequent hospital visits, falls, and other negative outcomes.
                </p>
                <h4 className="font-semibold">Key Signs to Watch For:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Unintentional Weight Loss:</strong> Losing weight without trying, especially a noticeable amount (e.g., 10 pounds in 6 months).
                  </li>
                  <li>
                    <strong>Poor Appetite:</strong> A consistent lack of interest in food or eating very little.
                  </li>
                  <li>
                    <strong>Fatigue and Weakness:</strong> A general loss of energy, strength, and increased tiredness.
                  </li>
                   <li>
                    <strong>Changes in Oral Health:</strong> Problems with teeth or dentures, or a dry mouth that makes it hard to eat.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Common Causes and Risk Factors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Why Malnutrition Happens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Many factors can contribute to poor nutrition in older adults.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Social Factors:</strong> Eating alone, loneliness, or depression can reduce the desire to eat.
                    </li>
                    <li>
                        <strong>Financial Hardship:</strong> Not having enough money for nutritious food is a major barrier.
                    </li>
                    <li>
                        <strong>Physical Difficulties:</strong> Trouble shopping for food, cooking, or even feeding oneself due to mobility issues.
                    </li>
                    <li>
                        <strong>Medical Issues:</strong> Chronic illnesses, medication side effects that cause dry mouth or loss of taste, and dental problems can all impact eating.
                    </li>
                    <li>
                        <strong>Cognitive Changes:</strong> People with dementia may forget to eat or have changes in their brain that affect appetite.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Feeding and Swallowing Problems (Dysphagia)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Identifying Swallowing Difficulties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Dysphagia is the medical term for difficulty swallowing. It's a common issue in older adults, especially after a stroke or with conditions like dementia.
                </p>
                <h4 className="font-semibold">Signs of a Swallowing Problem:</h4>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Coughing or Choking:</strong> Frequent coughing or choking during or after eating and drinking.
                    </li>
                    <li>
                        <strong>"Wet" or Gurgly Voice:</strong> A change in voice quality after swallowing.
                    </li>
                    <li>
                        <strong>Pocketing Food:</strong> Holding food in the cheeks instead of swallowing it.
                    </li>
                    <li>
                        <strong>Persistent Throat Clearing:</strong> Needing to clear the throat often while eating.
                    </li>
                </ul>
                <p className="mt-4 font-semibold text-destructive">If you notice these signs, it's crucial to report them to a doctor or speech therapist for a proper evaluation.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Handshake className="h-6 w-6 text-primary" />
              Strategies to Help
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Practical Tips to Improve Nutrition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Honor Food Preferences:</strong> Offer foods they enjoy. A favorite meal can be a powerful appetite stimulant.
                    </li>
                    <li>
                        <strong>Small, Frequent Meals:</strong> Six small meals may be less overwhelming than three large ones. Offer nutritious snacks between meals.
                    </li>
                    <li>
                        <strong>Fortify Foods:</strong> Increase calorie and protein content without increasing volume. Add protein powder, healthy oils, or cream to foods like oatmeal, soups, or mashed potatoes.
                    </li>
                     <li>
                        <strong>Create a Pleasant Mealtime Environment:</strong> Eat together, reduce distractions like the TV, and make mealtime a positive social event.
                    </li>
                    <li>
                        <strong>Offer Assistance:</strong> If needed, help with meal setup or feeding. Be patient and don't rush.
                    </li>
                     <li>
                        <strong>Look into Community Resources:</strong> Programs like Meals on Wheels can provide regular, nutritious meals for those who have trouble with food preparation.
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
