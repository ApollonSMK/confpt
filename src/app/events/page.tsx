
import { createServerClient } from '@/lib/supabase/server';
import type { Event } from '@/lib/data';
import { EventCard } from '@/components/event-card';
import { Calendar } from 'lucide-react';

async function getPublicEvents(): Promise<Event[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      confrarias (
        name,
        seal_url,
        seal_hint
      )
    `)
    .eq('is_public', true)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching public events:', error);
    return [];
  }

  return data as Event[];
}

export default async function EventsPage() {
  const events = await getPublicEvents();

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-12">
        <div className="inline-block p-4 mb-4 bg-primary/10 rounded-full">
          <Calendar className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">
          Agenda de Eventos
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore os próximos encontros, provas e celebrações organizados pelas nossas nobres confrarias.
        </p>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border rounded-lg">
          <p className="font-semibold text-lg">Nenhum evento público agendado.</p>
          <p className="text-muted-foreground">Por favor, volte mais tarde para ver as novidades.</p>
        </div>
      )}
    </div>
  );
}
