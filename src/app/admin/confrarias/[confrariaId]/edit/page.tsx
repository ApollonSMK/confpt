
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { regions, type Confraria } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
// import { updateConfraria } from './actions';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';

// Placeholder. We will create this action file next.
async function updateConfraria(values: any) {
    console.log("Updating confraria with:", values);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In the real implementation, this will call the server action
    return { success: true }; 
}

// Placeholder for fetching data. We will implement the real fetch later.
async function getConfraria(id: string): Promise<Confraria | null> {
    console.log("Fetching confraria with id:", id);
    await new Promise(resolve => setTimeout(resolve, 500));
    // This is mock data. In the real implementation, this will fetch from Supabase.
    if (id === "1") {
        return {
            id: 1,
            name: "Confraria do Queijo da Serra",
            motto: "Pela tradição e pelo sabor.",
            region: "Centro",
            seal_url: "https://placehold.co/100x100.png",
            seal_hint: "cheese mountain",
        } as Confraria;
    }
    return null;
}


const formSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  seal_url: z.string().url('Por favor, insira um URL válido para o selo.'),
  seal_hint: z.string().min(2, 'O hint deve ter pelo menos 2 caracteres.'),
  responsible_email: z.string().email("Por favor, insira um email válido para o responsável.").optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditConfrariaPage({ params }: { params: { confrariaId: string } }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [confraria, setConfraria] = useState<Confraria | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        async function loadConfraria() {
            setLoading(true);
            // In a real scenario, you'd fetch the confraria data here
            // and populate the form.
            // For now, let's just log it.
            console.log("Loading data for confraria ID:", params.confrariaId);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
            form.reset({
                 name: 'Placeholder Name',
                 motto: 'Placeholder Motto',
                 region: 'Norte',
                 seal_url: 'https://placehold.co/100x100.png',
                 seal_hint: 'placeholder',
                 responsible_email: 'exemplo@confraria.com'
            });
            setLoading(false);
        }
        loadConfraria();
    }, [params.confrariaId, form]);


    async function onSubmit(values: FormValues) {
        setLoading(true);
        // const result = await updateConfraria({ id: params.confrariaId, ...values });

        // if (result && result.error) {
        //     toast({
        //         title: "Erro ao Atualizar Confraria",
        //         description: result.error,
        //         variant: "destructive"
        //     });
        //     setLoading(false);
        // } else {
        //      toast({
        //         title: "Confraria Atualizada!",
        //         description: "Os dados da confraria foram atualizados com sucesso.",
        //     });
        // }
        
        console.log("Form submitted with values:", values);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Funcionalidade em desenvolvimento", description: "A lógica para guardar os dados será implementada a seguir." });
        setLoading(false);
    }

    if (loading && !form.formState.isDirty) {
        return <p className="text-center p-8">A carregar dados da confraria...</p>
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Editar Confraria</CardTitle>
                        <CardDescription>
                           Atualize os detalhes da confraria e atribua um responsável.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Confraria</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="motto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lema</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="region"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Região</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Selecione a região principal" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="seal_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL do Selo</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                                <FormField
                                control={form.control}
                                name="seal_hint"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dica para o Selo (IA)</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Card className="bg-accent/50 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-xl">Acesso do Responsável</CardTitle>
                                    <CardDescription>
                                        Indique o email do confrade que irá gerir esta confraria. Se o email não existir, será criado um novo utilizador com uma senha temporária.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="responsible_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email do Responsável</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="responsavel@confraria.pt" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>


                            <Button type="submit" size="lg" disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Alterações
                            </Button>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
