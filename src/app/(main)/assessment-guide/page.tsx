
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AssessmentGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          The Architecture of Geriatric Care Education
        </h1>
        <p className="text-muted-foreground">
          A Comprehensive Analysis of Curricula, Competencies, and Innovative
          Models
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="part-1">
        <AccordionItem value="part-1">
          <AccordionTrigger className="text-2xl font-semibold font-headline">
            Part I: The Foundations of Modern Geriatric Education
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <p className="text-muted-foreground">
              The rapid demographic shift towards an older global population has
              created an urgent and unprecedented demand for a healthcare
              workforce equipped with the specialized knowledge and skills to
              care for older adults. This necessity has catalyzed the evolution
              of geriatric medicine from a niche subspecialty into a core
              component of modern healthcare education. This foundational
              section will define the core tenets of the discipline, introduce
              the standardized frameworks that guide curriculum development, and
              map the continuum of competencies required across the spectrum of
              healthcare training.
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="section-1-1">
                <AccordionTrigger className="text-xl font-semibold">
                  1.1: Defining the Discipline: Core Principles
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>
                    Geriatric care education is built upon a distinct
                    philosophical and clinical foundation. It focuses on
                    improving health, preserving independence, and enhancing
                    quality of life. This requires a paradigm shift from a
                    single-disease model to a holistic approach that embraces
                    complexity and prioritizes patient-defined goals.
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <strong>Aging is not a disease:</strong> This principle is
                      critical for combating ageism and preventing the common
                      pitfall of dismissing treatable symptoms as inevitable
                      consequences of "old age".
                    </li>
                    <li>
                      <strong>Embracing Complexity:</strong> Geriatric care prepares
                      clinicians for a patient population where medical
                      conditions are commonly chronic, multiple, and
                      multifactorial.
                    </li>
                    <li>
                      <strong>Function and Quality of Life as Primary Outcomes:</strong> 
                      The ultimate goal is to maintain or improve an
                      individual's ability to perform daily activities.
                    </li>
                    <li>
                      <strong>The Social Context of Health:</strong> Understanding a
                      patient's life history, family, living circumstances, and
                      social supports is essential to effective management.
                    </li>
                    <li>
                      <strong>Atypical Presentation of Disease:</strong> Older
                      adults often do not exhibit classic signs of common
                      illnesses. A urinary tract infection may present as
                      confusion, and a heart attack as fatigue.
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="section-1-2">
                <AccordionTrigger className="text-xl font-semibold">
                  1.2: The 4Ms/5Ms Framework
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>
                    Developed by the Age-Friendly Health Systems initiative, the "4Ms" framework provides a practical blueprint for geriatric care. It distills the multifaceted nature of geriatrics into four essential domains. The American Geriatrics Society (AGS) has added a fifth 'M' for medical student education.
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <strong>What Matters:</strong> Aligning care with each
                      older adult's specific health outcome goals and care
                      preferences.
                    </li>
                    <li>
                      <strong>Medication:</strong> Ensuring that medications are
                      age-friendly and do not interfere with what matters,
                      mobility, or mentation. Includes deprescribing.
                    </li>
                    <li>
                      <strong>Mentation:</strong> Preventing, identifying, treating,
                      and managing dementia, depression, and delirium.
                    </li>
                    <li>
                      <strong>Mobility:</strong> Ensuring that older adults move
                      safely every day to maintain function and prevent falls.
                    </li>
                    <li>
                      <strong>Multicomplexity (5th M):</strong> Acknowledging the need to manage the complex interplay of multiple chronic conditions and social determinants of health.
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="section-1-3">
                <AccordionTrigger className="text-xl font-semibold">
                  1.3: A Continuum of Competencies
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>
                    Geriatric education is a carefully scaffolded continuum of learning that builds in complexity and depth as a healthcare professional advances through their training.
                  </p>
                  <Card>
                    <CardHeader>
                      <CardTitle>Table 1: Comparative Analysis of Geriatric Competency Frameworks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Learner Level</TableHead>
                            <TableHead>Framework</TableHead>
                            <TableHead>Key Competencies</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Medical Student</TableCell>
                            <TableCell>AGS/ADGAP 5Ms</TableCell>
                            <TableCell>Conduct functional assessment, recognize atypical presentations, understand polypharmacy principles, elicit goals of care.</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>IM/FM Resident</TableCell>
                            <TableCell>ACGME/ADGAP Minimum Competencies</TableCell>
                            <TableCell>Perform comprehensive geriatric assessment, manage common syndromes, initiate deprescribing, lead goals-of-care conversations.</TableCell>
                          </TableRow>
                           <TableRow>
                            <TableCell>Geriatrics Fellow</TableCell>
                            <TableCell>ACGME Geriatric Milestones</TableCell>
                            <TableCell>Lead interdisciplinary care plans, consult for other specialists, lead quality improvement, teach junior learners.</TableCell>
                          </TableRow>
                           <TableRow>
                            <TableCell>Practicing Nurse (RN)</TableCell>
                            <TableCell>ANCC GERO-BC™</TableCell>
                            <TableCell>Apply nursing process to manage common health problems, promote healthy aging, create age-friendly environments.</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="part-2">
          <AccordionTrigger className="text-2xl font-semibold font-headline">
            Part II: Tailoring Geriatric Modules for a Diverse Workforce
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
             <p className="text-muted-foreground">
              Providing high-quality care to older adults cannot be the exclusive domain of specialist geriatricians. A "whole-ecosystem" approach to education is required, encompassing everyone who interacts with older adults, from physicians to direct-care staff and informal family caregivers.
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="section-2-1">
                <AccordionTrigger className="text-xl font-semibold">2.1: Educating the Next Generation of Physicians</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>Integrating geriatrics into medical education ensures all future physicians have foundational skills. This is done through a mix of didactic instruction, clinical training, and research opportunities.</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Preclinical Years:</strong> Lectures on communication, functional assessment, and chronic disease management.</li>
                    <li><strong>Clinical Experience:</strong> Immersive rotations in Acute Care for Elders (ACE) units, ambulatory practices, and house call programs.</li>
                    <li><strong>Research:</strong> Programs like the Medical Student Training in Aging Research (MSTAR) cultivate interest in academic geriatrics.</li>
                    <li><strong>Residency Training:</strong> Focus on practical application and mastery in managing complex patients across different settings.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="section-2-2">
                <AccordionTrigger className="text-xl font-semibold">2.2: Equipping the Nursing Profession for Elder Care</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>Nurses are on the front lines. Their education ranges from foundational competencies for all RNs to advanced training for specialists.</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Core Competencies:</strong> Built around the 4Ms, focusing on assessment and management of geriatric syndromes.</li>
                    <li><strong>Continuing Education:</strong> Specialized modules on polypharmacy, palliative care, osteoporosis, and more.</li>
                    <li><strong>Person-Centered Care:</strong> Training emphasizes that challenging behaviors are often expressions of unmet needs.</li>
                    <li><strong>Certification:</strong> The American Nurses Credentialing Center (ANCC) offers the Gerontological Nursing Certification (GERO-BC™) for demonstrated expertise.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="section-2-3">
                <AccordionTrigger className="text-xl font-semibold">2.3: The Collaborative Imperative: Interprofessional Education (IPE)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>The complex nature of geriatric care makes a team-based approach essential. IPE prepares learners for collaborative practice.</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Rationale:</strong> Interdisciplinary teams provide coordinated, integrated care, improve patient outcomes, and facilitate safe transitions between care settings.</li>
                    <li><strong>Structure:</strong> IPE modules are active and experiential, often using case-based or problem-based learning to simulate real-world challenges.</li>
                    <li><strong>Core Competencies:</strong> Focus on values/ethics, understanding roles, interprofessional communication, and teamwork.</li>
                    <li><strong>Innovative Models:</strong> Tools like the Geriatric Simulations Toolkit and Project ECHO (Extension for Community Healthcare Outcomes) are powerful models for IPE.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="section-2-4">
                <AccordionTrigger className="text-xl font-semibold">2.4: Empowering the Caregiving Ecosystem</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>The formal healthcare system is only one part of the ecosystem. Millions of direct-care workers and informal family caregivers provide the majority of hands-on care.</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Direct-Care Workers:</strong> Online learning platforms offer accessible modules on infection control, safe transfers, and disease-specific care.</li>
                    <li><strong>Family Caregivers:</strong> An estimated 43.5 million unpaid caregivers in the U.S. provide care. Programs like "Powerful Tools for Caregivers®" help them develop self-care skills, reduce stress, and improve confidence.</li>
                    <li><strong>Support Resources:</strong> A vast network exists, including the Eldercare Locator, Area Agencies on Aging, AARP, and the Alzheimer’s Association, offering information, support groups, and advocacy.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="part-3">
          <AccordionTrigger className="text-2xl font-semibold font-headline">
            Part III: Core Clinical Content of Geriatric Training Modules
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
             <p className="text-muted-foreground">
              A robust curriculum must equip learners with the specific knowledge and skills needed to address the most common and high-risk challenges faced by older adults.
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="section-3-1">
                <AccordionTrigger className="text-xl font-semibold">3.1: Multimorbidity and Polypharmacy</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>Two of the most defining challenges in geriatrics are the co-occurrence of multiple chronic conditions (multimorbidity) and the use of multiple medications (polypharmacy).</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Multimorbidity Management:</strong> Training emphasizes an integrated, team-based approach, as standard single-disease guidelines often don't apply.</li>
                    <li><strong>Polypharmacy Principles:</strong> Older adults are at high risk for adverse drug events due to physiological changes. Training covers geriatric pharmacotherapy and deprescribing—the systematic process of stopping medications where harms outweigh benefits.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="section-3-2">
                <AccordionTrigger className="text-xl font-semibold">3.2: The Mind in Aging: The "3Ds"</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>Cognitive and affective disorders are highly prevalent. Training focuses on differentiating Delirium, Dementia, and Depression.</p>
                   <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Depression:</strong> Often presents atypically in older adults with physical complaints like fatigue.</li>
                    <li><strong>Dementia:</strong> A chronic, progressive decline. Training focuses on recognizing subtle signs and using screening tools like the MMSE.</li>
                    <li><strong>Delirium:</strong> An acute, fluctuating disturbance of consciousness that is a medical emergency. Training emphasizes using tools like the Confusion Assessment Method (CAM) and non-pharmacologic interventions.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="section-3-3">
                <AccordionTrigger className="text-xl font-semibold">3.3: Mobility, Falls, and Nutrition</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                   <p>Maintaining physical function is central to promoting independence. These three domains are deeply interconnected.</p>
                   <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Mobility Assessment:</strong> A systematic evaluation of bed mobility, transfers, balance, and gait.</li>
                    <li><strong>Falls Prevention:</strong> A systematic approach to screen for risk and assess intrinsic (e.g., weakness, medications) and extrinsic (e.g., poor lighting, rugs) risk factors. The CDC's STEADI initiative provides comprehensive resources.</li>
                    <li><strong>Nutritional Assessment:</strong> Using tools like the Mini Nutritional Assessment (MNA®) to identify and manage malnutrition, a common but overlooked geriatric syndrome.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="section-3-4">
                <AccordionTrigger className="text-xl font-semibold">3.4: Palliative and End-of-Life Care</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p>Geriatrics and palliative care are deeply intertwined, sharing a philosophy of patient-centered, holistic care to improve quality of life.</p>
                   <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Core Principles:</strong> Alleviating suffering and enhancing quality of life for both patients and caregivers, from the point of diagnosis of a serious illness.</li>
                    <li><strong>Communication Skills:</strong> Training on how to discuss serious news, clarify goals of care, lead family meetings, and facilitate advance care planning is critical.</li>
                    <li><strong>End-of-Life Care:</strong> Specialized curricula like ELNEC prepare providers to care for patients in their final phase of life, focusing on comfort, symptom management, and dignity.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
