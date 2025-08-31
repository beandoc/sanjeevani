
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User, Hospital, Stethoscope } from 'lucide-react';

export const EmergencyContactCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Emergency Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Primary Caregiver</p>
            <p className="text-sm text-muted-foreground">Jane Doe - (555) 123-4567</p>
          </div>
          <Phone className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-4">
          <Stethoscope className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Doctor / Clinic</p>
            <p className="text-sm text-muted-foreground">Dr. Smith - (555) 987-6543</p>
          </div>
           <Phone className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-4">
          <Hospital className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Primary Hospital</p>
            <p className="text-sm text-muted-foreground">General Hospital - (555) 246-8135</p>
          </div>
           <Phone className="h-4 w-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
};
