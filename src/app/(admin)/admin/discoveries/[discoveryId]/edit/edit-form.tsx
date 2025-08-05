
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { districts, Confraria, Discovery, DiscoveryType } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteDiscovery, updateDiscovery } from './actions';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  id: z.number(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(3, 'A descrição curta deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'O editorial deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.'}),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confraria_id: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("URL do website inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
});


type FormValues = z.infer<typeof formSchema>;

interface EditDiscoveryFormProps {
    discovery: Discovery;
    confrarias: Confraria[];
    discoveryTypes: DiscoveryType[];
}

export function EditDiscoveryForm({ discovery, confrarias, discoveryTypes }: EditDiscoveryFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: discovery.id,
            title: discovery.title,
            description: discovery.description,
            editorial: discovery.editorial,
            district: discovery.district,
            type_id: String(discovery.type_id),
            confraria_id: discovery.confraria_id?.toString() ?? undefined,
            address: discovery.address ?? '',
            website: discovery.website ?? '',
            phone: discovery.phone ?? '',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await updateDiscovery(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Atualizar Descoberta",
                description: result.error,
                variant: "destructive"
            });
            setLoading(false);
        }
    }
    
    async function handleDelete() {
        setDeleting(true);
        const result = await deleteDiscovery(discovery.id);
        if (result && result.error) {
            toast({
                title: "Erro ao Apagar Descoberta",
                description: result.error,
                variant: "destructive"
            });
            setDeleting(false);
        } else {
            toast({
                title: "Descoberta Apagada!",
                description: "A descoberta foi removida com sucesso.",
            });
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-3xl">Editar Descoberta</CardTitle>
                            <CardDescription>
                               Atualize os detalhes da descoberta. A gestão da galeria de imagens será adicionada em breve.
                            </CardDescription>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isto irá apagar permanentemente a descoberta e todos os seus dados associados.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sim, apagar descoberta
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
                                <FormField control={form.control} name="district" render={({ field }) => (
                                    <FormItem><FormLabel>Distrito</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="type_id" render={({ field }) => (
                                    <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{discoveryTypes.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                </div>
                                <FormField control={form.control} name="confraria_id" render={({ field }) => (
                                    <FormItem><FormLabel>Confraria (Opcional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Associar a uma confraria" /></SelectTrigger></FormControl><SelectContent><SelectItem value="null">Nenhuma (Comunitário)</SelectItem>{confrarias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                
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
                                    Guardar Alterações
                                </Button>
                            </form>
                        </FormProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
