import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ExternalLink, Phone, ShieldCheck, HeartPulse, Building2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const resources = [
  {
    category: 'National Emergency & Government Portals',
    icon: Building2,
    items: [
      {
        name: 'Elder Line — National Helpline for Senior Citizens (MoSJE & NISD)',
        description: 'Toll-free national helpline offering guidance, emotional support, rescue, and legal aid.',
        url: 'https://elderline.dosje.gov.in',
        phone: '14567'
      },
      {
        name: 'Ministry of Health & Family Welfare — NPHCE Programme',
        description: 'National Programme for the Health Care of Elderly providing geriatric OPDs & regional centers.',
        url: 'https://main.mohfw.gov.in',
        phone: null
      },
      {
        name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        description: 'Government health assurance covering up to ₹5 lakh/year per family, including expanded senior coverage.',
        url: 'https://nha.gov.in/PM-JAY',
        phone: '14555'
      },
      {
        name: 'Tele-MANAS — National Mental Health Helpline',
        description: '24x7 free psychological counseling and mental health triage for caregivers and seniors.',
        url: 'https://telemanas.mohfw.gov.in',
        phone: '14416'
      },
    ],
  },
  {
    category: 'Geriatric Professional & Clinical Societies',
    icon: HeartPulse,
    items: [
      {
        name: 'Geriatric Society of India (GSI)',
        description: 'Pioneering organization dedicated to geriatric clinical research and physician education.',
        url: 'https://geriatricindia.com',
        phone: null
      },
      {
        name: 'Indian Academy of Geriatrics (IAG)',
        description: 'National association advancing clinical gerontology, standards of practice, and education.',
        url: 'https://iagindia.in',
        phone: null
      },
      {
        name: 'National Institute of Social Defence (NISD)',
        description: 'Nodal training institute for caregiving, dementia sensitization, and old age care management.',
        url: 'https://nisd.gov.in',
        phone: null
      },
    ],
  },
  {
    category: 'Caregiver Support & Elder Welfare NGOs',
    icon: ShieldCheck,
    items: [
      {
        name: 'HelpAge India',
        description: 'Leading national NGO running mobile healthcare units, caregiver training, and elder rights advocacy.',
        url: 'https://www.helpageindia.org',
        phone: '1800-180-1253'
      },
      {
        name: 'Agewell Foundation',
        description: 'Grassroots foundation working for elder empowerment, social engagement, and caregiver support.',
        url: 'https://www.agewellfoundation.org',
        phone: '011-29836486'
      },
      {
        name: 'Pallium India — Palliative Care & Relief Network',
        description: 'Dedicated to pain management, home-based palliative care, and caregiver respite counseling.',
        url: 'https://palliumindia.org',
        phone: '1800-572-8880'
      },
    ],
  },
  {
    category: 'Condition-Specific Care Networks',
    icon: BookOpen,
    items: [
      {
        name: 'Alzheimer’s & Related Disorders Society of India (ARDSI)',
        description: 'Comprehensive dementia caregiver counseling, day-care centers, and home-care training.',
        url: 'https://www.ardsi.org',
        phone: '0484-2808299'
      },
      {
        name: 'Parkinson’s Disease & Movement Disorder Society (PDMDS)',
        description: 'Rehabilitation therapy, support groups, and multidisciplinary care across India.',
        url: 'https://www.parkinsonssocietyindia.com',
        phone: '022-24147040'
      },
      {
        name: 'Indian Council of Medical Research (ICMR) — Geriatric Guidelines',
        description: 'Evidence-based protocols and consensus clinical guidelines for elderly care.',
        url: 'https://www.icmr.nic.in',
        phone: null
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          <span>Sanjeevani Care Network</span>
          <span>•</span>
          <span>India Resource Directory</span>
        </div>
        <h1 className="text-3xl font-bold font-headline">National Geriatric & Caregiver Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Curated directory of recognized Indian government welfare portals, clinical associations, and caregiver helplines.
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="National Emergency & Government Portals" className="w-full space-y-3">
        {resources.map((resource) => (
          <AccordionItem
            key={resource.category}
            value={resource.category}
            className="border border-border/80 rounded-2xl bg-card/60 px-5 shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="text-base sm:text-lg font-bold hover:no-underline py-4">
              <span className="flex items-center gap-2.5">
                <resource.icon className="w-5 h-5 text-primary" />
                {resource.category}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ul className="space-y-3 pt-1">
                {resource.items.map((item) => (
                  <li
                    key={item.name}
                    className="p-3.5 rounded-xl bg-background border border-border/60 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{item.name}</span>
                        {item.phone && (
                          <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                            <Phone className="w-2.5 h-2.5 mr-1 inline" /> {item.phone}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.phone && (
                        <a href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 cursor-pointer text-xs py-1 px-2.5">
                            Call
                          </Badge>
                        </a>
                      )}
                      <Link
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/5"
                      >
                        <span>Visit Portal</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
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
