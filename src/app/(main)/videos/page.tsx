
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
  {
    id: 8,
    title: 'Bed to Bedside Commode Transfer',
    description:
      'Learn how to safely transfer a person from a bed to a bedside commode.',
    category: 'Mobility',
    youtubeId: 'DPksvXhLY1U',
  },
  {
    id: 9,
    title: 'Bed to Chair Transfer',
    description: 'A tutorial on safely transferring a person from a bed to a chair.',
    category: 'Mobility',
    youtubeId: 'FjHtL7gIQLk',
  },
  {
    id: 10,
    title: 'Nasogastric Tube Feeding',
    description: 'A guide on how to perform nasogastric tube feeding for patients who cannot eat normally.',
    category: 'Nutrition',
    youtubeId: 'UjRAVHXpxIU',
  },
  {
    id: 11,
    title: 'How to Give a Bed Bath',
    description: 'A step-by-step guide on how to give a complete bed bath to someone who is unable to get out of bed.',
    category: 'Hygiene',
    youtubeId: '9VKox-wy4fU',
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
