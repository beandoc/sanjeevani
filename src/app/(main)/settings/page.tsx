
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile, SkillLevel } from '@/context/role-context';


export default function SettingsPage() {
  const { 
    skillLevel, 
    setSkillLevel, 
    caregivingScenario, 
    setCaregivingScenario 
  } = useProfile();

  const patientConditions = [
    'General Frailty',
    'Dementia',
    'Heart Failure',
    'Stroke Recovery',
    'Parkinson\'s Disease',
    'COPD',
    'Post-Surgery Recovery',
    'Multiple Chronic Conditions',
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Profile & Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and learning preferences.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Suresh Kumar" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="caregiver@example.com"
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Profile</CardTitle>
            <CardDescription>
              Tailor your learning experience by providing more context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Your Experience Level</Label>
              <Select 
                value={skillLevel} 
                onValueChange={(value) => setSkillLevel(value as SkillLevel)}
              >
                <SelectTrigger id="experience">
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    Beginner (New to caregiving)
                  </SelectItem>
                  <SelectItem value="intermediate">
                    Intermediate (Some experience)
                  </SelectItem>
                  <SelectItem value="advanced">
                    Advanced (Years of experience)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Primary Care Condition</Label>
              <Select
                value={caregivingScenario}
                onValueChange={setCaregivingScenario}
              >
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select a primary condition" />
                </SelectTrigger>
                <SelectContent>
                  {patientConditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <p className="text-xs text-muted-foreground pt-1">
                This helps us personalize your learning path.
              </p>
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
