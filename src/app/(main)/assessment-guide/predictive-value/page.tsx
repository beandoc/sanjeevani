
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

export default function PredictiveValuePage() {
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
            Part III: Core Clinical Content (Continued)
          </CardTitle>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 3.3: Upholding Independence: Modules on Mobility, Falls, and Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Maintaining physical function is central to the goal of promoting independence and quality of life in older adults. Educational modules focused on mobility, falls, and nutrition provide the foundational skills for assessing and preserving this function. These clinical domains are deeply interconnected, as poor nutrition can lead to muscle weakness (sarcopenia), which in turn increases the risk of falls and subsequent loss of mobility.
          </p>
          <h4 className="font-semibold">Mobility Assessment</h4>
          <p>
            Mobility assessment is an essential skill taught in geriatric care. It is a regular and systematic process that goes beyond simply asking if a person can walk. Training modules instruct learners on how to perform a comprehensive evaluation that includes assessing mobility in bed, the ability to rise from a sitting position, the safety of transfers (e.g., from bed to chair), static and dynamic balance, and the quality of ambulation and gait. This is often complemented by the use of standardized tools to measure a patient's ability to perform basic and instrumental activities of daily living (ADLs and IADLs), which provides a clear picture of their functional status in their home environment.
          </p>
          <h4 className="font-semibold">Falls Prevention</h4>
          <p>
            Because falls are a leading cause of injury, disability, and death in older adults, falls prevention is a major focus of geriatric education. Training modules are designed to teach a systematic approach to this geriatric syndrome. This begins with universal screening to identify individuals at risk, followed by a comprehensive assessment to identify specific intrinsic risk factors (e.g., muscle weakness, gait impairment, postural hypotension, vision problems, cognitive impairment, high-risk medications) and extrinsic, environmental risk factors (e.g., poor lighting, throw rugs, lack of grab bars). The U.S. Centers for Disease Control and Prevention's (CDC) STEADI (Stopping Elderly Accidents, Deaths, and Injuries) initiative provides a comprehensive suite of training materials, clinical tools, and patient education resources to help healthcare providers implement effective, multifactorial fall prevention programs. Learning objectives for these modules include mastering gait and balance assessments, performing medication reviews to identify fall-risk-increasing drugs, and creating individualized care plans that may include exercise programs, home modifications, and patient/caregiver education.
          </p>
          <h4 className="font-semibold">Nutritional Assessment</h4>
          <p>
            Nutritional assessment is another critical component, as malnutrition is a common but often overlooked geriatric syndrome that contributes to frailty, poor wound healing, and functional decline. The Mini Nutritional Assessment (MNA®) is the most well-validated and widely taught screening tool for identifying older adults who are malnourished or at risk of malnutrition. Educational resources for the MNA® are extensive and include detailed user guides, training videos that demonstrate how to perform anthropometric measurements (such as calf circumference or knee height for bedbound patients), and evidence-based algorithms for recommended interventions based on a patient's MNA® score. Recognizing that older adults and their caregivers are key partners in care, a simplified Self-MNA® has also been developed for them to complete and bring to their healthcare provider to facilitate a discussion about nutrition. For those seeking deeper knowledge, online certificate and master's level courses in geriatric nutrition are available, training students to apply current research, identify common dietary deficiencies, and plan balanced, culturally appropriate diets for older adults.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Section 3.4: Compassion and Communication in Serious Illness: Palliative and End-of-Life Care
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            A core component of comprehensive geriatric care is the integration of palliative care principles. While historically viewed as separate disciplines, geriatrics and palliative care are increasingly seen as deeply intertwined, sharing a common philosophy of patient-centered, holistic care. Geriatrics brings expertise in managing frailty, comorbidity, and functional decline, while palliative care brings expertise in symptom management and supporting patients and families through serious illness. Together, they aim to improve quality of life, regardless of prognosis.
          </p>
          <p>
            The core principles of palliative care are woven throughout geriatric training modules. The fundamental goal is to alleviate suffering and enhance quality of life for both patients and their caregivers. This requires a shift in focus from solely curative interventions to a comprehensive approach that prioritizes human dignity and addresses the multifaceted needs of the individual—physical, psychosocial, and spiritual. This approach is not reserved for the very end of life but is applicable from the point of diagnosis of a serious illness.
          </p>
          <p>
            Because navigating serious illness involves complex emotions and difficult decisions, communication skills training is a critical element of palliative care education. Effective communication is the foundation for building trust and ensuring that care aligns with a patient's values. Training modules, such as those offered by the Center to Advance Palliative Care (CAPC), teach clinicians specific techniques for discussing serious news and prognosis, clarifying goals of care, leading patient and family meetings, and facilitating advance care planning. Learners practice specific skills drawn from fields like psychiatry, such as practicing active listening and reflection, using silence effectively to allow patients space to process information, and naming emotions to convey empathy and understanding.
          </p>
           <p>
            Training also prepares clinicians for end-of-life care. Hospice care is a specific model of palliative care for individuals who are dying, with a primary focus on comfort and symptom alleviation. Specialized curricula, like the ELNEC Geriatric Curriculum, are designed to equip nurses and other providers with the skills needed to care for patients in post-acute settings like nursing homes and hospices. This training helps providers understand and navigate the complex treatment decisions, difficult symptom management, and profound psychosocial and spiritual distress that often characterize the final phase of life, ensuring a more peaceful and dignified experience for the patient.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
