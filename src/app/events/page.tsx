
import { createServerClient } from '@/lib/supabase/server';
import { regions, type Event } from '@/lib/data';
import { EventCard } from '@/components/event-card';
import { Calendar } from 'lucide-react';
import { EventFilter } from '@/components/event-filter';

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

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const allEvents = await getPublicEvents();
  
  const region = searchParams?.region as string || '';

  let filteredEvents = allEvents;

  if (region) {
    filteredEvents = filteredEvents.filter(d => d.region === region);
  }


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

      <EventFilter regions={regions} />

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border rounded-lg mt-12">
          <p className="font-semibold text-lg">Nenhum evento encontrado.</p>
          <p className="text-muted-foreground">Tente limpar os filtros para ver todos os eventos públicos agendados.</p>
        </div>
      )}
    </div>
  );
}
