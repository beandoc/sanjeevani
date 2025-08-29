import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
  const title = params.id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/modules">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Module content for "{title}" would be displayed here.</p>
          {/* Placeholder for module content */}
        </CardContent>
      </Card>
    </div>
  );
}
