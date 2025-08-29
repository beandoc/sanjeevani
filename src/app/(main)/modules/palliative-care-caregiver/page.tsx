
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HeartHandshake, MessageCircle, ShieldCheck, BookUser } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PalliativeCareCaregiverPage() {
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
          Palliative Care: A Comforting Guide for Caregivers
        </h1>
        <p className="text-muted-foreground">
          Understanding palliative care can bring peace and comfort to you and your loved one during a challenging time.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-6 w-6 text-primary" />
              What is Palliative Care?
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Focusing on Comfort and Quality of Life</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Palliative care is a specialized type of medical care that focuses on providing relief from the symptoms and stress of a serious illness. The main goal is to improve the quality of life for both the patient and their family.
                </p>
                <p>
                  <strong>It's not the same as hospice.</strong> Palliative care can be provided at any age and at any stage of an illness, and it can be given alongside curative treatments like chemotherapy or dialysis. It's an extra layer of support that works with your loved one's other doctors.
                </p>
                <h4 className="font-semibold">What does it provide?</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Symptom Management:</strong> Help with pain, shortness of breath, fatigue, nausea, loss of appetite, and other distressing symptoms.
                    </li>
                    <li>
                        <strong>Communication and Support:</strong> Helps you and your loved one navigate complex medical information and make difficult decisions.
                    </li>
                    <li>
                        <strong>Emotional and Spiritual Care:</strong> Addresses the emotional, social, and spiritual needs that come with a serious illness.
                    </li>
                    <li>
                        <strong>Coordination of Care:</strong> Ensures that all the doctors, nurses, and specialists involved are on the same page.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              Your Role as a Caregiver
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <h4 className="font-semibold text-lg">Advocating for Your Loved One</h4>
            <p>You know your loved one best. Your voice is crucial in making sure their wishes and needs are heard.</p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Be the Eyes and Ears:</strong> Keep track of symptoms. When do they happen? What makes them better or worse? This information is vital for the care team.
                </li>
                <li>
                    <strong>Ask Questions:</strong> Don't be afraid to ask for clarification. If you don't understand a treatment or a medication, ask the palliative care team to explain it in simple terms.
                </li>
                <li>
                    <strong>Express Their Wishes:</strong> Help your loved one express what is most important to them. Is it being at home? Is it having the energy to see family? These goals will guide the care plan.
                </li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Providing Comfort</h4>
            <p>Your presence and simple acts of kindness can make a world of difference.</p>
             <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Physical Comfort:</strong> Help with repositioning, offer gentle massages, keep their mouth moist, and ensure their environment is calm and comfortable.
                </li>
                <li>
                    <strong>Emotional Comfort:</strong> Listen to their fears and concerns without judgment. Share memories, read to them, play their favorite music, or simply sit in silence with them.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <BookUser className="h-6 w-6 text-primary" />
              Caring for Yourself
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p className="text-muted-foreground">You cannot pour from an empty cup. Taking care of your own well-being is essential to providing good care for your loved one.</p>
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>Accept Help:</strong> When friends and family offer to help, let them. Give them specific tasks, like picking up groceries, running an errand, or sitting with your loved one for an hour.
                </li>
                <li>
                    <strong>Take Breaks:</strong> Step away for short periods to recharge. Even 15 minutes to take a walk, read a book, or call a friend can make a difference.
                </li>
                <li>
                    <strong>Connect with Others:</strong> Join a caregiver support group, either online or in person. Talking with others who understand what you're going through can be incredibly helpful.
                </li>
                <li>
                    <strong>Acknowledge Your Feelings:</strong> It's normal to feel a wide range of emotions—sadness, anger, guilt, and exhaustion. Allow yourself to feel them without judgment.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
