
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { upsertEvent } from './actions';
import { useState } from 'react';
import type { Event } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  id: z.number().optional(), // optional for new events
  confraria_id: z.number(),
  name: z.string().min(3, 'O nome do evento deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  event_date: z.date({ required_error: 'Por favor, selecione uma data para o evento.'}),
  location: z.string().optional(),
  image_url: z.string().url('URL inválido.').optional().or(z.literal('')),
  image_hint: z.string().optional(),
  is_public: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EventFormProps {
    confrariaId: number;
    event?: Event | null;
    onSuccess?: () => void;
}

export function EventForm({ confrariaId, event = null, onSuccess }: EventFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: event?.id,
            confraria_id: confrariaId,
            name: event?.name || '',
            description: event?.description || '',
            event_date: event ? new Date(event.event_date) : undefined,
            location: event?.location || '',
            image_url: event?.image_url || 'https://placehold.co/600x400.png',
            image_hint: event?.image_hint || 'event placeholder',
            is_public: event?.is_public ?? true,
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await upsertEvent(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Guardar Evento",
                description: result.error,
                variant: "destructive"
            });
        } else {
             toast({
                title: "Sucesso!",
                description: result.message,
            });
            if (onSuccess) onSuccess();
        }
        setLoading(false);
    }
    
    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Evento</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Ex: Prova de Vinhos do Douro" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data do Evento</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: pt })
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Localização</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Ex: Caves do Vinho do Porto, Gaia" />
                            </FormControl>
                             <FormDescription>Seja específico para ajudar os confrades a encontrar.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea rows={4} placeholder="Descreva o que vai acontecer, o programa, convidados especiais, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL da Imagem do Evento</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Visibilidade do Evento</FormLabel>
                            <FormDescription>
                                Eventos públicos são visíveis a todos. Eventos privados apenas para membros da confraria.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />


                <Button type="submit" size="lg" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {event ? 'Guardar Alterações' : 'Criar Evento'}
                </Button>
            </form>
        </FormProvider>
    );
}
