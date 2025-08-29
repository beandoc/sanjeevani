import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

const resources = [
  {
    category: 'Support Groups',
    items: [
      { name: 'Family Caregiver Alliance', url: '#' },
      { name: 'National Alliance for Caregiving', url: '#' },
      { name: 'Well Spouse Association', url: '#' },
    ],
  },
  {
    category: 'Professional Organizations',
    items: [
      { name: 'American Society on Aging', url: '#' },
      { name: 'Gerontological Society of America', url: '#' },
      { name: 'National Council on Aging', url: '#' },
    ],
  },
  {
    category: 'Government & Aid',
    items: [
      { name: 'Eldercare Locator', url: '#' },
      { name: 'Medicare.gov', url: '#' },
      { name: 'National Institute on Aging', url: '#' },
    ],
  },
  {
    category: 'Disease-Specific Information',
    items: [
      { name: "Alzheimer's Association", url: '#' },
      { name: 'American Heart Association', url: '#' },
      { name: 'Parkinson\'s Foundation', url: '#' },
      { name: 'National Kidney Foundation', url: '#' },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Resource Directory</h1>
        <p className="text-muted-foreground">
          A curated list of external organizations, support groups, and helpful
          websites.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {resources.map((resource) => (
          <AccordionItem key={resource.category} value={resource.category}>
            <AccordionTrigger className="text-lg font-semibold">
              {resource.category}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pt-2">
                {resource.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-md p-3 hover:bg-secondary"
                    >
                      <span>{item.name}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
