
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
import { regions } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createConfraria } from './actions';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  seal_url: z.string().url('Por favor, insira um URL válido. Use placehold.co se não tiver uma.'),
  seal_hint: z.string().min(2, 'O hint deve ter pelo menos 2 caracteres. Ex: "golden key"'),
});

type FormValues = z.infer<typeof formSchema>;


export default function NewConfrariaPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            motto: '',
            region: undefined,
            seal_url: 'https://placehold.co/100x100.png',
            seal_hint: 'placeholder',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await createConfraria(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Criar Confraria",
                description: result.error,
                variant: "destructive"
            });
            setLoading(false);
        } else {
             toast({
                title: "Confraria Criada!",
                description: "A nova confraria foi adicionada com sucesso.",
            });
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Adicionar Nova Confraria</CardTitle>
                        <CardDescription>
                            Preencha os detalhes da nova confraria que se junta à nossa nobre causa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome da Confraria</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Confraria do Queijo da Serra" {...field} />
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
                                                <Textarea
                                                placeholder="Um lema que inspire gerações..."
                                                {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>A frase que representa o espírito da confraria.</FormDescription>
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
                                                <Input placeholder="https://exemplo.com/selo.png" {...field} />
                                            </FormControl>
                                            <FormDescription>O link para a imagem que serve como selo oficial.</FormDescription>
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
                                                <Input placeholder="Ex: chave dourada" {...field} />
                                            </FormControl>
                                            <FormDescription>Duas palavras para ajudar a IA a identificar a imagem.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" size="lg" disabled={loading} className="w-full">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Adicionar Confraria
                                </Button>
                            </form>
                        </FormProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
