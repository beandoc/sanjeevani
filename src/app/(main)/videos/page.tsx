import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const videos = [
  {
    id: 1,
    title: 'Safe Lifting and Transfer Techniques',
    description:
      'Learn the proper way to lift and transfer patients to prevent injury to both caregiver and patient.',
    duration: '12:34',
    category: 'Mobility',
    thumbnail: 'https://picsum.photos/600/400?random=1',
    dataAiHint: 'caregiver elderly',
  },
  {
    id: 2,
    title: 'Managing Medications Effectively',
    description:
      'A step-by-step guide to organizing and administering medications for patients with complex schedules.',
    duration: '08:52',
    category: 'Medication',
    thumbnail: 'https://picsum.photos/600/400?random=2',
    dataAiHint: 'pills medicine',
  },
  {
    id: 3,
    title: 'Basic Wound Care at Home',
    description:
      'How to clean, dress, and monitor minor wounds to prevent infection.',
    duration: '15:10',
    category: 'First Aid',
    thumbnail: 'https://picsum.photos/600/400?random=3',
    dataAiHint: 'wound dressing',
  },
  {
    id: 4,
    title: 'Communication Strategies for Dementia',
    description:
      'Effective techniques to communicate with individuals experiencing memory loss and confusion.',
    duration: '18:20',
    category: 'Dementia',
    thumbnail: 'https://picsum.photos/600/400?random=4',
    dataAiHint: 'elderly talking',
  },
];

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Video Library</h1>
        <p className="text-muted-foreground">
          Practical demonstrations of essential caregiving skills.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="group overflow-hidden">
            <div className="relative">
              <Image
                src={video.thumbnail}
                alt={video.title}
                width={600}
                height={400}
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={video.dataAiHint}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayCircle className="h-16 w-16 text-white" />
              </div>
              <Badge className="absolute right-2 top-2">{video.duration}</Badge>
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-xl">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{video.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">{video.category}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
