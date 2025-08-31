
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export const SectionCard = ({
  title,
  children,
  sectionId,
  onComplete,
  isCompleted,
}: {
  title: string;
  children: React.ReactNode;
  sectionId: number;
  onComplete: (id: number) => void;
  isCompleted: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
    <CardFooter>
      <Button
        onClick={() => onComplete(sectionId)}
        disabled={isCompleted}
        variant={isCompleted ? 'secondary' : 'default'}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isCompleted ? 'Completed' : 'Mark as Complete'}
      </Button>
    </CardFooter>
  </Card>
);
