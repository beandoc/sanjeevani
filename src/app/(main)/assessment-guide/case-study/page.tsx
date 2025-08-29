
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CaseStudyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Button variant="outline" asChild>
        <Link href="/assessment-guide">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessment Guide
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">
            Part V: A Global Case Study: The Geriatric Education Ecosystem in India
          </CardTitle>
          <CardDescription>
            To understand how the principles and models of geriatric education are applied in a real-world context, it is instructive to examine a nation facing a profound demographic transition. India, with its rapidly aging population and evolving healthcare system, provides a compelling case study of a nation actively building a multi-tiered geriatric education ecosystem from the ground up. This pragmatic approach offers valuable lessons for other countries confronting similar challenges.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 5.1: Policy and Population: The National Context for Geriatric Care
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The impetus for developing a geriatric care workforce in India is driven by both demographic necessity and national policy. The demographic imperative is stark: India's population of adults aged 60 and over currently exceeds 150 million and is projected to more than double to 347 million by 2050. This dramatic increase in the older adult population is creating an urgent and massive demand for senior living infrastructure, healthcare services, and a trained workforce capable of meeting their unique needs.
          </p>
          <p>
            In response, the Government of India has established a policy framework to support the health and well-being of its older citizens. The landmark National Policy on Older Persons (NPOP), announced in 1999, affirmed the government's commitment to ensuring financial and food security, health care, shelter, and protection against abuse and exploitation for older persons. Building on this foundation, the Ministry of Health and Family Welfare launched the National Programme for the Health Care of Elderly (NPHCE) in 2010-11. The explicit objective of the NPHCE is to provide dedicated, specialized, and comprehensive healthcare facilities for older adults at the primary, secondary, and tertiary levels of the state healthcare delivery system.
          </p>
          <p>
            These broad policies are supported by a range of specific government initiatives. The Rashtriya Vayoshri Yojana (RVY) scheme provides aids and assistive living devices—such as walking sticks, hearing aids, wheelchairs, and spectacles—free of cost to low-income senior citizens with age-related disabilities. To provide immediate support and address grievances, a national toll-free helpline for senior citizens, "Elder line 14567," was launched nationwide. Furthermore, to foster innovation, the SAGE (Seniorcare Aging Growth Engine) portal was launched to identify and provide equity support to start-ups developing products and services for the welfare of the elderly. These policies and programs create the systemic context and demand for a robust geriatric education system.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 5.2: Building Capacity: The Spectrum of Geriatric Training in India
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The Indian case study reveals a pragmatic and multi-tiered strategy for building a geriatric workforce. Recognizing that it is not feasible to rely solely on producing a small number of highly trained specialists, the country is simultaneously pursuing a "top-down," "bottom-up," and "middle-out" approach to education, creating capacity at all levels of the healthcare system.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
                <strong>Top-Down (Specialist Training):</strong> This strategy is focused on developing specialist leaders and academics through postgraduate medical education. A growing number of India's most prestigious medical colleges, including the All India Institute of Medical Sciences (AIIMS) in Delhi and Christian Medical College (CMC) in Vellore, now offer three-year Doctor of Medicine (MD) or Diplomate of National Board (DNB) residency programs in Geriatric Medicine. The comprehensive curriculum for these programs covers the applied basic sciences of aging, clinical geriatric medicine across all major subspecialties, psycho-geriatrics, and social and preventive geriatrics, including rehabilitation. These rigorous programs are designed to produce the future faculty, researchers, and expert clinicians who will lead the field.
            </li>
            <li>
                <strong>Middle-Out (Upskilling):</strong> This approach aims to upskill the existing healthcare workforce. Institutions offer post-doctoral fellowships and postgraduate diplomas for physicians who have already completed a residency in a field like Internal Medicine or Family Medicine. These programs, such as the Postgraduate Diploma in Geriatric Medicine at CMC Vellore, often use a blended learning model with online modules, assignments, and in-person contact programs to provide practicing doctors with the essential nuances of geriatric care. In parallel, the Indian Nursing Council has established a detailed syllabus for geriatric nursing, ensuring that nursing education incorporates core content on the aging process, comprehensive assessment of older persons, management of common geriatric health problems, and the leadership role of nurses in geriatric care settings.
            </li>
            <li>
                <strong>Bottom-Up (Direct Care Workforce):</strong> This strategy is rapidly building a large-scale workforce for direct, hands-on care through certificate courses for health aides. A wide variety of public and private institutions, including Indira Gandhi National Open University (IGNOU), offer certificate programs for Geriatric Care Assistants or Health Aides. These programs are typically shorter in duration, ranging from 150 hours to six months, and focus on developing essential, practical caregiving skills such as assisting with personal hygiene, mobility, nutrition planning, and medication administration. A key feature of many of these programs is their explicit goal of creating job opportunities not only within India's growing elder care sector—in hospitals, old age homes, and home-care services—but also internationally, in countries where certified caregivers are in high demand. This multi-level educational strategy represents a comprehensive and scalable response to a pressing public health need.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
