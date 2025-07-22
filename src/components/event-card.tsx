
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type Event } from '@/lib/data';
import { Calendar, MapPin, Shield } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow duration-300 hover:shadow-xl border-2 border-transparent hover:border-primary/50">
      <CardHeader className="p-0">
        <div className="aspect-[16/9] relative w-full">
          <Image
            src={event.image_url ?? 'https://placehold.co/600x400.png'}
            alt={event.name}
            fill
            className="object-cover"
            data-ai-hint={event.image_hint ?? 'event celebration'}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
        </div>
        <CardTitle className="font-headline text-2xl mb-2">{event.name}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location || 'Local a confirmar'}</span>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        {event.confrarias ? (
            <Link href={`/confrarias/${event.confraria_id}`} className="flex items-center gap-3 w-full hover:bg-accent/50 transition-colors rounded-md p-2 -m-2">
                 <Image src={event.confrarias.seal_url} alt={event.confrarias.name} width={40} height={40} className="rounded-full bg-background" data-ai-hint={event.confrarias.seal_hint} />
                 <div>
                    <p className="text-xs font-semibold text-primary">Organizado por:</p>
                    <p className="text-sm font-bold">{event.confrarias.name}</p>
                 </div>
            </Link>
        ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Organizador não especificado</span>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
