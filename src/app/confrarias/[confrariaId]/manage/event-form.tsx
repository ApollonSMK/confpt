
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
import { Calendar as CalendarIcon, Loader2, Upload, Send, ArrowRight, PenSquare, Eye, ArrowLeft } from 'lucide-react';
import { upsertEvent } from './actions';
import { useState, useRef } from 'react';
import type { Event } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { districts } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5; // In MB

const formSchema = z.object({
  id: z.number().optional(),
  confraria_id: z.number(),
  name: z.string().min(3, 'O nome do evento deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  event_date: z.date({ required_error: 'Por favor, selecione uma data para o evento.'}),
  location: z.string().min(3, 'A localização deve ter pelo menos 3 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.'}),
  is_public: z.boolean().default(true),
  image: z.any()
    .refine((file) => !file || file?.size === undefined || file.size <= MAX_IMAGE_SIZE * 1024 * 1024, `O tamanho máximo é ${MAX_IMAGE_SIZE}MB.`)
    .refine((file) => !file || file?.type === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type), "Apenas são aceites os formatos .jpg, .jpeg, .png e .webp."),
});

type FormValues = z.infer<typeof formSchema>;

interface EventFormProps {
    confrariaId: number;
    confrariaRegion: (typeof districts)[number];
    event?: Event | null;
    onSuccess?: () => void;
}

export function EventForm({ confrariaId, confrariaRegion, event = null, onSuccess }: EventFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const formRef = useRef<HTMLFormElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: event?.id,
            confraria_id: confrariaId,
            name: event?.name || '',
            description: event?.description || '',
            event_date: event ? new Date(event.event_date) : undefined,
            location: event?.location || '',
            district: event?.district || confrariaRegion,
            is_public: event?.is_public ?? true,
            image: undefined,
        },
    });

     const { trigger } = form;

    const handleNextStep = async () => {
        const isValid = await trigger(["name", "event_date", "district", "location"]);
        if (isValid) {
            setStep(2);
        }
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(formRef.current!);
        const result = await upsertEvent(formData);

        if (result && result.error) {
            toast({
                title: "Erro ao Guardar Evento",
                description: result.error,
                variant: "destructive"
            });
             setLoading(false);
        } else {
             toast({
                title: "Sucesso!",
                description: result.message,
            });
            if (onSuccess) onSuccess();
        }
    }
    
    return (
        <FormProvider {...form}>
            <form ref={formRef} onSubmit={onSubmit} className="space-y-4 py-4">
                 {/* Hidden fields that need to be in the form */}
                <input type="hidden" {...form.register("id")} />
                <input type="hidden" {...form.register("confraria_id")} />
                <input type="hidden" name="event_date" value={form.getValues('event_date')?.toISOString() ?? ''} />
                <input type="hidden" name="is_public" value={String(form.getValues('is_public'))} />
                {event?.image_url && <input type="hidden" name="current_image_url" value={event.image_url} />}

                {step === 1 && (
                     <Card className="border-none shadow-none">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center justify-between">
                                <span>Passo 1: O Essencial do Evento</span>
                                <span className="text-sm font-normal text-muted-foreground">1 de 2</span>
                            </CardTitle>
                            <CardDescription>Comece pelo O Quê, Quando e Onde. Os detalhes vêm a seguir.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><PenSquare className="h-4 w-4"/>Nome do Evento</FormLabel>
                                    <FormControl><Input {...field} placeholder="Ex: Prova de Vinhos do Douro" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="event_date" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/>Data do Evento</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                                                        {field.value ? (format(field.value, "PPP", { locale: pt })) : (<span>Escolha uma data</span>)}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="district" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Distrito</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                            <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Localização Exata</FormLabel>
                                    <FormControl><Input {...field} placeholder="Ex: Caves do Vinho do Porto, Gaia" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                        <CardFooter>
                            <Button type="button" onClick={handleNextStep} size="lg" className="ml-auto">
                                Continuar <ArrowRight className="ml-2"/>
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="border-none shadow-none">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center justify-between">
                                <span>Passo 2: Detalhes Adicionais</span>
                                <span className="text-sm font-normal text-muted-foreground">2 de 2</span>
                            </CardTitle>
                            <CardDescription>Descreva o evento, defina a visibilidade e adicione uma imagem de capa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><PenSquare className="h-4 w-4"/>Descrição do Evento</FormLabel>
                                    <FormControl><Textarea rows={4} placeholder="Descreva o que vai acontecer, o programa, convidados especiais, etc." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="is_public" render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="flex items-center gap-2"><Eye className="h-4 w-4"/>Visibilidade</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={(value) => field.onChange(value === 'true')} defaultValue={String(field.value)} className="flex flex-col space-y-1">
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="true" /></FormControl>
                                                <FormLabel className="font-normal">Público (visível a todos os visitantes)</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="false" /></FormControl>
                                                <FormLabel className="font-normal">Privado (visível apenas a membros)</FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field: { onChange, ...rest } }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Imagem de Capa</FormLabel>
                                     {event?.image_url && (
                                        <div className="relative h-40 w-full rounded-md overflow-hidden border">
                                            <Image src={event.image_url} alt="Imagem de capa atual" layout="fill" objectFit="cover" />
                                        </div>
                                    )}
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept="image/png, image/jpeg, image/webp" 
                                            onChange={e => onChange(e.target.files ? e.target.files[0] : null)}
                                            {...rest}
                                        />
                                    </FormControl>
                                    <FormDescription>Uma boa imagem promove melhor o seu evento. Tamanho máximo: {MAX_IMAGE_SIZE}MB.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                                <ArrowLeft className="mr-2"/> Voltar
                            </Button>
                            <Button type="submit" size="lg" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {event ? 'Guardar Alterações' : 'Criar Evento'}
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </form>
        </FormProvider>
    );
}
