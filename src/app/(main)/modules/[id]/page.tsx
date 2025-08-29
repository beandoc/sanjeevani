import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Update the Props type to reflect that params and searchParams are Promises
type Props = {
  params: Promise<{ id: string }>; // params is now a Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams is also a Promise
};

// Make the component an async function to await the params
export default async function ModuleDetailPage({
  params,
  // searchParams is part of Props but not directly used in this component,
  // so we don't need to await it unless its values were needed.
  // We still declare it in the type for correctness.
}: Props) {
  // Await the params Promise to get the actual id object
  const resolvedParams = await params;
  const title = resolvedParams.id
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
