
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Foot, Eye, ShieldCheck, Sun, Droplets } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FootCarePage() {
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
          Foot Care Essentials for Older Adults
        </h1>
        <p className="text-muted-foreground">
          A guide for caregivers on why foot care is critical for mobility and overall health.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary" />
              Daily Foot Inspection
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Why Daily Checks are Important</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Many older adults, especially those with diabetes, have reduced sensation in their feet. They might not feel a small cut, blister, or sore, which can quickly become a serious infection. A daily check is the best way to catch problems early.
                </p>
                <h4 className="font-semibold">What to Look For:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Cuts, Scrapes, or Blisters:</strong> Check the entire foot, including between the toes.
                  </li>
                  <li>
                    <strong>Color Changes:</strong> Look for redness, paleness, or dark spots.
                  </li>
                  <li>
                    <strong>Swelling:</strong> Compare one foot to the other.
                  </li>
                   <li>
                    <strong>Corns and Calluses:</strong> Note any thick, hard patches of skin, as these can hide sores underneath.
                  </li>
                </ul>
                 <p className="mt-4 text-sm text-muted-foreground">If the person can't see their own feet, use a mirror or ask for help. Good lighting is key.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Droplets className="h-6 w-6 text-primary" />
              Proper Hygiene
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Keeping Feet Clean and Dry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Wash Gently:</strong> Wash feet daily with lukewarm water and mild soap. Avoid soaking, as it can dry out the skin.
                    </li>
                    <li>
                        <strong>Dry Thoroughly:</strong> Pay special attention to drying between the toes to prevent fungal infections like athlete's foot.
                    </li>
                    <li>
                        <strong>Moisturize:</strong> Apply a good quality lotion to the tops and bottoms of the feet to prevent dry skin and cracking. Do not put lotion between the toes.
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
              Nail Care
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Safe Toenail Trimming</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Improper nail trimming can cause ingrown toenails and infections.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Trim Straight Across:</strong> Cut the toenails straight across and gently file the edges with an emery board. Avoid rounding the corners.
                    </li>
                    <li>
                        <strong>Don't Cut Too Short:</strong> Be careful not to cut nails shorter than the end of the toe.
                    </li>
                    <li>
                        <strong>Seek Professional Help:</strong> If the person has thick, hard-to-cut nails, poor circulation, or diabetes, it is safest to have their nails trimmed by a podiatrist (foot doctor).
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Foot className="h-6 w-6 text-primary" />
              Footwear and Socks
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>The Right Fit Matters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Properly Fitting Shoes:</strong> Shoes that are too tight can cause blisters and sores. Have feet measured, as size can change over time.
                    </li>
                    <li>
                        <strong>Protective Footwear:</strong> Encourage wearing shoes or sturdy slippers at all times to protect from injury. Avoid walking barefoot.
                    </li>
                    <li>
                        <strong>Check Inside Shoes:</strong> Before putting on shoes, always check inside for small pebbles or rough seams that could cause irritation.
                    </li>
                     <li>
                        <strong>Clean, Dry Socks:</strong> Wear clean, dry socks every day. Seamless socks are a good choice, especially for people with diabetes.
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
