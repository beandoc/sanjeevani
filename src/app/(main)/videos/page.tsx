
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const videos = [
  {
    id: 1,
    title: 'Safe Lifting and Transfer Techniques',
    description:
      'Learn the proper way to lift and transfer patients to prevent injury to both caregiver and patient.',
    category: 'Mobility',
    youtubeId: 'S-41623vjCg',
  },
  {
    id: 2,
    title: 'Managing Medications Effectively',
    description:
      'A step-by-step guide to organizing and administering medications for patients with complex schedules.',
    category: 'Medication',
    youtubeId: 'BrG3tD3gA4o',
  },
  {
    id: 3,
    title: 'Basic Wound Care at Home',
    description:
      'How to clean, dress, and monitor minor wounds to prevent infection.',
    category: 'First Aid',
    youtubeId: 'j9JvJcMfp3o',
  },
  {
    id: 4,
    title: 'Communication Strategies for Dementia',
    description:
      'Effective techniques to communicate with individuals experiencing memory loss and confusion.',
    category: 'Dementia',
    youtubeId: '1fhrvikubOw',
  },
  {
    id: 5,
    title: 'Stand Pivot Transfer',
    description:
      'A demonstration of the stand pivot transfer technique for helping someone with mobility challenges.',
    category: 'Mobility',
    youtubeId: '2i_rjQ9SGa0',
  },
  {
    id: 6,
    title: 'Using a Patient Transfer Board',
    description:
      'A short demonstration on how to safely use a transfer board for elderly patient transfers.',
    category: 'Mobility',
    youtubeId: 'kP6LMw67LvM',
  },
  {
    id: 7,
    title: 'Moving a Fallen Person',
    description:
      'Learn the proper technique for helping someone up from the floor after a fall.',
    category: 'First Aid',
    youtubeId: '9I1IvLoiOx4',
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {videos.map((video) => (
          <Card key={video.id} className="group overflow-hidden">
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              ></iframe>
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
