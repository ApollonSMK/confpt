
'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { TestimonialWithUser } from '@/lib/data';
import { addTestimonial, deleteTestimonial } from '@/app/discoveries/[slug]/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface DiscoveryTestimonialsProps {
  discoveryId: number;
  user: User | null;
  initialTestimonials: TestimonialWithUser[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Publicar Testemunho
    </Button>
  );
}

export function DiscoveryTestimonials({ discoveryId, user, initialTestimonials }: DiscoveryTestimonialsProps) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const userHasPosted = user && testimonials.some(t => t.user_id === user.id);
  
  const handleAddTestimonial = async (formData: FormData) => {
    const content = formData.get('content') as string;
    if (!content || content.trim().length < 10) {
        toast({ title: 'Erro', description: 'O seu testemunho tem de ter pelo menos 10 caracteres.', variant: 'destructive' });
        return;
    }
    
    const result = await addTestimonial(formData);
    
    if (result.error) {
        toast({ title: 'Erro ao Publicar', description: result.error, variant: 'destructive' });
    } else {
        toast({ title: 'Sucesso!', description: 'O seu testemunho foi publicado.' });
        // Optimistic update can be tricky with server-side data, revalidating is safer.
        // For a better UX, we could add the new testimonial to the state, but it requires more data.
        router.refresh(); 
    }
  };

  const handleDelete = async (testimonialId: number) => {
    const formData = new FormData();
    formData.append('testimonialId', testimonialId.toString());
    formData.append('slug', params.slug as string);

    const result = await deleteTestimonial(formData);
     if (result.error) {
        toast({ title: 'Erro ao Apagar', description: result.error, variant: 'destructive' });
    } else {
        toast({ title: 'Testemunho Apagado', description: 'O seu testemunho foi removido com sucesso.' });
        setTestimonials(current => current.filter(t => t.id !== testimonialId));
    }
  }

  return (
    <div className="space-y-8">
      {user && !userHasPosted && (
        <Card>
          <CardContent className="p-6">
            <form action={handleAddTestimonial} className="space-y-4">
              <input type="hidden" name="discoveryId" value={discoveryId} />
              <input type="hidden" name="slug" value={params.slug as string} />
              <Textarea
                name="content"
                placeholder="Partilhe a sua experiência com esta descoberta... O que sentiu? O que a torna única? O seu testemunho é valioso."
                rows={4}
                required
                minLength={10}
              />
              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      )}

      {testimonials.length > 0 ? (
        <div className="space-y-6">
          {testimonials.map(testimonial => (
            <Card key={testimonial.id} className="p-6 border-l-4 border-primary/20">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.user.avatar_url || undefined} alt={testimonial.user.full_name} />
                  <AvatarFallback>{testimonial.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                     <p className="font-semibold">{testimonial.user.full_name}</p>
                     {user?.id === testimonial.user_id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(testimonial.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                        </Button>
                     )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(testimonial.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="whitespace-pre-wrap font-body text-foreground/90">{testimonial.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
          <p className="font-semibold text-lg">Seja o primeiro a deixar um testemunho.</p>
          <p>A sua experiência pode guiar outros confrades nesta jornada de descobertas.</p>
        </div>
      )}
    </div>
  );
}
