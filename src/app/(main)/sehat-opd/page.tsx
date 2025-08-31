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
          Access healthcare from the comfort of your home with the Government of
          India's flagship telemedicine service.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is Sehat OPD?</CardTitle>
          <CardDescription>
            eSanjeevani's Sehat OPD is a patient-to-doctor teleconsultation
            service that provides free access to medical advice and
            prescriptions. It is designed to connect citizens, particularly
            those in rural and remote areas, with doctors and specialists across
            the country.
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
            Follow these simple steps to schedule your teleconsultation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Step 1: Patient Registration</h3>
              <p className="text-sm text-muted-foreground">
                First, you need to verify your mobile number. An OTP will be
                sent to your phone. After verification, fill in the patient
                registration form.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ListOrdered className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Step 2: Get a Token</h3>
              <p className="text-sm text-muted-foreground">
                After registering, you will receive a token or appointment ID.
                You will also get an SMS notification with your login details.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Step 3: Login and Wait</h3>
              <p className="text-sm text-muted-foreground">
                Log in to the app using your mobile number. You will enter a
                virtual waiting room. You will see your position in the queue,
                and a "CALL NOW" button will activate when it's your turn.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Step 4: Video Consultation</h3>
              <p className="text-sm text-muted-foreground">
                Once you press the "CALL NOW" button, your video consultation
                with the doctor will begin. Make sure you have a stable internet
                connection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Step 5: Download ePrescription</h3>
              <p className="text-sm text-muted-foreground">
                After the consultation, you will receive a notification to
                download your ePrescription. You can then use this to get your
                medications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
