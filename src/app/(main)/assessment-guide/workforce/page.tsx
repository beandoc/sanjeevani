
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

export default function WorkforcePage() {
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
            Part II: Tailoring Geriatric Modules for a Diverse Workforce
          </CardTitle>
          <CardDescription>
            The demographic reality of an aging population dictates that providing high-quality care to older adults cannot be the exclusive domain of a small number of specialist geriatricians. The Institute of Medicine has declared that the education and training of the entire healthcare workforce in geriatrics is "woefully inadequate". To address this systemic gap, a "whole-ecosystem" approach to education is required, encompassing everyone who interacts with older adults, from physicians and nurses to direct-care staff and informal family caregivers. This necessitates the development of tailored educational modules that meet the specific needs, roles, and learning contexts of this diverse audience.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 2.1: Educating the Next Generation of Physicians
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The integration of geriatrics into medical education is a critical step in ensuring that all future physicians possess the foundational skills to care for the majority of their future patients. This education is structured through a combination of didactic instruction, immersive clinical training, and opportunities for specialized research, beginning in the first year of medical school and continuing through residency.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
                <strong>Preclinical Years:</strong> Medical school curricula introduce foundational concepts through didactic learning. First- and second-year students typically receive lectures on core topics such as effective communication with older adults, the importance of avoiding ageism, the principles of functional assessment, and the impact of chronic disease management. As students progress to their clinical clerkships, these didactic sessions become more specific, covering common geriatric syndromes like dementia, urinary incontinence, falls, and elder abuse.
            </li>
            <li>
                <strong>Clinical Experience:</strong> The cornerstone of physician training, however, is clinical experience. Medical schools are increasingly offering a variety of immersive geriatric rotations. A fourth-year geriatric medicine elective, for example, can provide students with exposure to older adults across a wide range of settings, including specialized Acute Care for Elders (ACE) units in hospitals, ambulatory practices, patient homes via house call programs, and nursing homes. A more innovative approach is the creation of longitudinal programs, such as the Longitudinal Experience to Advance Patient Care (LEAP) at Weill Cornell, which pairs a student with a specific patient whom they follow for all four years of medical school. This model allows students to witness the evolution of disease processes over time, learn the art of building long-term patient relationships, and appreciate the real-world complexities patients face when navigating the healthcare system.
            </li>
            <li>
                <strong>Research Opportunities:</strong> To cultivate interest in academic geriatrics, many institutions offer summer research programs. Programs like the Medical Student Training in Aging Research (MSTAR), funded by the National Institute on Aging (NIA), provide selected students with an intensive, mentored experience in aging-related research, combined with clinical and didactic activities. These programs are vital for inspiring the next generation of clinician-scientists in the field.
            </li>
            <li>
                <strong>Residency Training:</strong> During residency training, the focus shifts from foundational knowledge to practical application and mastery. For residents in Internal Medicine and Family Medicine, training emphasizes the development of skills in managing complex patients across different settings. The most successful residency programs feature clinical experiences that include exposure to model geriatric care delivery, direct involvement in managing patients through transitions of care (e.g., from hospital to rehabilitation), and active participation in interdisciplinary teamwork. To support this, organizations like the AGS and ADGAP have developed comprehensive geriatric curricula specifically designed for residency programs, providing a roadmap for program directors to integrate core geriatric topics into their training schedules.
            </li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 2.2: Equipping the Nursing Profession for Elder Care
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Nurses are on the front lines of caring for older adults across every healthcare setting, making their education and training in geriatrics absolutely critical. Geriatric nursing education encompasses a spectrum from foundational competencies for all registered nurses (RNs) to advanced training and certification for specialists.
          </p>
           <ul className="list-disc space-y-2 pl-5">
            <li>
                <strong>Core Competencies:</strong> These are often built around the 4Ms framework, providing a solid foundation in comprehensive geriatric assessment (CGA), the ability to differentiate between normal and atypical changes of aging, and the management of common geriatric syndromes. These foundational modules ensure that nurses can identify and address the most pressing issues facing their older patients, from mobility challenges to medication side effects.
            </li>
            <li>
                <strong>Advanced Modules:</strong> A wide array of advanced and specialized modules are available for continuing education. These courses allow nurses to deepen their expertise in specific, high-risk areas of geriatric care. Topics frequently covered include the management of polypharmacy and deprescribing, palliative and hospice care, understanding and treating osteoporosis, managing complex conditions like Parkinson's disease, and strategies for mitigating the unique risks of hospitalization for older adults. Highly specialized curricula, such as the End-of-Life-Nursing Education Consortium (ELNEC) Geriatric Curriculum, provide in-depth training for nurses working in post-acute and long-term care settings, focusing on the skills needed to provide high-quality palliative care.
            </li>
            <li>
                <strong>Person-Centered & Home-Based Care:</strong> A significant focus of modern nursing education is on person-centered and home-based care. Training modules increasingly emphasize person-directed care frameworks, which teach nurses to enhance communication and relationships with older adults by understanding that challenging behaviors are often expressions of unmet needs. As care increasingly shifts to the home, specialized modules for home care nurses have become essential. These courses cover the unique challenges of managing medication, chronic conditions, and palliative care in a community setting, promoting team-based, coordinated, and evidence-based care for older adults aging in place.
            </li>
            <li>
                <strong>Certification Pathways:</strong> For nurses who wish to formally demonstrate their expertise, certification pathways are available. The American Nurses Credentialing Center (ANCC) offers the Gerontological Nursing Certification (GERO-BC™), a nationally recognized credential. Achieving this certification is a rigorous process, requiring a candidate to hold an active RN license, have practiced for at least two years full-time, have accrued a minimum of 2,000 hours of clinical practice in gerontological nursing within the last three years, and have completed 30 hours of relevant continuing education before passing a competency-based examination. This certification signifies a high level of clinical knowledge and dedication to the specialty.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
