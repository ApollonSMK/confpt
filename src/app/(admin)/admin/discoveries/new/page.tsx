
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { regions, Confraria, DiscoveryType } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createDiscovery } from './actions';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(3, 'A descrição curta deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'O editorial deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  type: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confraria_id: z.string().optional(),
  image_url: z.string().url("URL da imagem inválido.").optional().or(z.literal('')),
  image_hint: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("URL do website inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;


export default function NewDiscoveryPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [confrarias, setConfrarias] = useState<Confraria[]>([]);
    const [discoveryTypes, setDiscoveryTypes] = useState<DiscoveryType[]>([]);

    useEffect(() => {
        const supabase = createClient();
        async function fetchConfrarias() {
            const { data } = await supabase.from('confrarias').select('*').order('name');
            setConfrarias(data || []);
        }
        async function fetchDiscoveryTypes() {
            const { data } = await supabase.from('discovery_types').select('*').order('name');
            setDiscoveryTypes(data || []);
        }
        fetchConfrarias();
        fetchDiscoveryTypes();
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            editorial: '',
            region: undefined,
            type: undefined,
            confraria_id: undefined,
            image_url: 'https://placehold.co/600x400.png',
            image_hint: 'placeholder',
            address: '',
            website: '',
            phone: '',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await createDiscovery(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Criar Descoberta",
                description: result.error,
                variant: "destructive"
            });
            setLoading(false);
        } else {
             toast({
                title: "Descoberta Criada!",
                description: "A nova descoberta foi adicionada com sucesso.",
            });
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Adicionar Nova Descoberta</CardTitle>
                        <CardDescription>
                            Preencha os detalhes da nova descoberta para a publicar diretamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Descrição Curta</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormDescription>Um resumo para os cartões.</FormDescription><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="editorial" render={({ field }) => (
                                    <FormItem><FormLabel>Editorial</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormDescription>O texto principal da descoberta.</FormDescription><FormMessage /></FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="region" render={({ field }) => (
                                    <FormItem><FormLabel>Região</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{discoveryTypes.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                </div>
                                <FormField control={form.control} name="confraria_id" render={({ field }) => (
                                    <FormItem><FormLabel>Confraria (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Associar a uma confraria" /></SelectTrigger></FormControl><SelectContent><SelectItem value="null">Nenhuma (Comunitário)</SelectItem>{confrarias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="image_url" render={({ field }) => (
                                    <FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="image_hint" render={({ field }) => (
                                    <FormItem><FormLabel>Dica da Imagem (IA)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                </div>
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Morada (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="website" render={({ field }) => (
                                    <FormItem><FormLabel>Website (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                
                                <Button type="submit" size="lg" disabled={loading} className="w-full">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Descoberta
                                </Button>
                            </form>
                        </FormProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
