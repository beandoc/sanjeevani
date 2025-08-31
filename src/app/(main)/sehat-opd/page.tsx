
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  ListOrdered,
  Smartphone,
  UserPlus,
  Video,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileText,
  Wifi,
  Info,
} from 'lucide-react';
import Link from 'next/link';

export default function SehatOpdPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Sehat OPD: National Teleconsultation Service
        </h1>
        <p className="text-muted-foreground">
          The Tri-services Teleconsultation Service of the Ministry of Defence (MoD).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is Sehat OPD?</CardTitle>
          <CardDescription>
            Services e-Health Assistance and Tele-consultation (SeHAT) is a teleconsultation service for all entitled personnel and their families from the three Services, including ECHS beneficiaries. It aims to provide safe, structured, video-based clinical consultations from the comfort of home.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link
              href="https://play.google.com/store/apps/details?id=com.cdac.sehatopd"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              Download the App from Google Play
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use the Sehat OPD App</CardTitle>
          <CardDescription>
            Follow these simple steps to schedule and complete your teleconsultation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">A. Registration & Verification</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Verify your mobile number using an OTP.</li>
                <li>Fill in the Patient Registration Form in the app.</li>
                <li>Physically report to a SeHAT medical officer to verify your identity using ID cards (Aadhaar/ECHS card).</li>
                <li>Once verified, you will receive a confirmation message. Your registration is valid for one year.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">B. Login</h3>
               <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Log in with your registered mobile number and an OTP.</li>
                <li>On your personal page, you can view past prescriptions and approved family members.</li>
                <li>You can use your mobile number to arrange consultations for your approved family members.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">C. Wait for Your Turn</h3>
               <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>After logging in and requesting a consultation, you will be placed in a virtual waiting queue.</li>
                <li>When a doctor is assigned, the "CALL NOW" button will activate.</li>
                <li>You must click the "CALL NOW" button within 30 seconds, or you will be moved lower in the queue.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">D. Consultation</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Your consultation will begin via video, audio, and chat.</li>
                <li>The doctor can access any health records you uploaded when you requested the consultation.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">E. ePrescription</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>The doctor prepares your prescription during the call.</li>
                <li>At the end of the consultation, the doctor sends the ePrescription to you and closes the call.</li>
                <li>You can then download, print, or email the ePrescription. A copy is saved to your patient profile.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Other Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <Wifi className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Internet Speed</h3>
              <p className="text-sm text-muted-foreground">
                For a smooth video consultation experience, an internet speed of at least 1 Mbps is recommended.
              </p>
            </div>
          </div>
           <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Platform Compatibility</h3>
              <p className="text-sm text-muted-foreground">
                SeHAT OPD is a responsive web application and can be used on computers, large screen tablets, and smartphones.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Profile Changes</h3>
              <p className="text-sm text-muted-foreground">
                Once registered, you cannot alter your personal details. However, an authorized SeHAT medical officer can make changes for you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
