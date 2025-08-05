
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
import { districts, portugalDistricts } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createConfraria } from './actions';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.'}),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.'}),
  seal_url: z.string().url('Por favor, insira um URL válido. Use placehold.co se não tiver uma.'),
  seal_hint: z.string().min(2, 'O hint deve ter pelo menos 2 caracteres. Ex: "golden key"'),
  history: z.string().optional(),
  founders: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;


export default function NewConfrariaPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [municipalities, setMunicipalities] = useState<string[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            motto: '',
            district: undefined,
            municipality: undefined,
            seal_url: 'https://placehold.co/100x100.png',
            seal_hint: 'placeholder',
            history: '',
            founders: '',
        },
    });

    const { watch, setValue } = form;
    const selectedDistrict = watch('district');

    useEffect(() => {
        if (selectedDistrict && portugalDistricts[selectedDistrict as keyof typeof portugalDistricts]) {
            setMunicipalities(portugalDistricts[selectedDistrict as keyof typeof portugalDistricts]);
            setValue('municipality', ''); // Reset municipality when district changes
        } else {
            setMunicipalities([]);
        }
    }, [selectedDistrict, setValue]);

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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="district"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Distrito</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Selecione o distrito" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="municipality"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Concelho</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={municipalities.length === 0}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Selecione o concelho" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {municipalities.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                 <FormField
                                    control={form.control}
                                    name="history"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>A Nossa História (Opcional)</FormLabel>
                                            <FormControl>
                                                <Textarea rows={5} placeholder="Conte a história, as origens e a missão da sua confraria..." {...field} />
                                            </FormControl>
                                            <FormDescription>Este texto aparecerá na página pública.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="founders"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fundadores (Opcional)</FormLabel>
                                            <FormControl>
                                                <Textarea rows={3} placeholder="Liste os nomes dos membros fundadores..." {...field} />
                                            </FormControl>
                                            <FormDescription>Reconheça quem deu início a esta irmandade.</FormDescription>
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
