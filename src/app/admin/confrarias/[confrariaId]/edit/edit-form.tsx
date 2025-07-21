
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Loader2, Trash2 } from 'lucide-react';
import { deleteConfraria, updateConfraria } from './actions';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  seal_url: z.string().url('Por favor, insira um URL válido para o selo.'),
  seal_hint: z.string().min(2, 'O hint deve ter pelo menos 2 caracteres.'),
  responsible_email: z.string().email("Por favor, insira um email válido para o responsável.").optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface EditConfrariaFormProps {
    confraria: FormValues;
}

export function EditConfrariaForm({ confraria }: EditConfrariaFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: confraria,
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await updateConfraria(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Atualizar Confraria",
                description: result.error,
                variant: "destructive"
            });
            setLoading(false);
        }
    }
    
    async function handleDelete() {
        setDeleting(true);
        const result = await deleteConfraria(confraria.id);
        if (result && result.error) {
            toast({
                title: "Erro ao Apagar Confraria",
                description: result.error,
                variant: "destructive"
            });
            setDeleting(false);
        } else {
            toast({
                title: "Confraria Apagada!",
                description: "A confraria foi removida com sucesso.",
            });
            router.push('/admin/dashboard');
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-3xl">Editar Confraria</CardTitle>
                            <CardDescription>
                               Atualize os detalhes da confraria e atribua um responsável.
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
                                    Esta ação não pode ser desfeita. Isto irá apagar permanentemente a confraria e desassociar todas as descobertas relacionadas.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sim, apagar confraria
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                            Indique o email de um confrade existente para o tornar responsável por esta confraria. Se o utilizador não existir, terá que ser criado manualmente.
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
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
