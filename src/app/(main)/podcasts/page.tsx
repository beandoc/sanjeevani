import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Play } from 'lucide-react';

const podcasts = [
  {
    id: 1,
    title: "The Caregiver's Journey",
    episode: 'Ep. 12: Navigating Dementia and Communication',
    duration: '45 min',
    category: 'Dementia',
  },
  {
    id: 2,
    title: 'Senior Health Today',
    episode: 'Heart Health for the Elderly',
    duration: '32 min',
    category: 'Heart Failure',
  },
  {
    id: 3,
    title: 'Mindful Caregiving',
    episode: 'Preventing Caregiver Burnout',
    duration: '55 min',
    category: 'Self-Care',
  },
  {
    id: 4,
    title: 'The Stroke Survivor',
    episode: 'Supporting Rehabilitation at Home',
    duration: '38 min',
    category: 'Stroke',
  },
];

export default function PodcastsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Podcast Library</h1>
        <p className="text-muted-foreground">
          Expert insights and stories for caregivers on the go.
        </p>
      </div>
      <div className="space-y-4">
        {podcasts.map((podcast) => (
          <Card
            key={podcast.id}
            className="flex flex-col items-start justify-between p-4 sm:flex-row sm:items-center"
          >
            <div className="mb-4 flex items-center gap-4 sm:mb-0">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Mic className="h-6 w-6 text-accent" />
              </div>
              <div>
                <CardTitle className="font-headline text-lg">
                  {podcast.episode}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{podcast.title}</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
              <Badge variant="secondary">{podcast.category}</Badge>
              <span className="w-20 text-right text-sm text-muted-foreground">
                {podcast.duration}
              </span>
              <Button variant="ghost" size="icon">
                <Play className="h-5 w-5" />
                <span className="sr-only">Play episode</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
