

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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Award, MapPin } from 'lucide-react';
import { deleteUser, updateUser } from './actions';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { ranks, type Discovery } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const formSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  rank_override: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
    userData: User;
    sealedDiscoveries: Pick<Discovery, 'id' | 'title' | 'district' | 'slug'>[];
}

export function EditUserForm({ userData, sealedDiscoveries }: EditUserFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: userData.id,
            email: userData.email,
            full_name: userData.user_metadata?.full_name || '',
            rank_override: userData.user_metadata?.rank_override || 'none',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await updateUser(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Atualizar Utilizador",
                description: result.error,
                variant: "destructive"
            });
             setLoading(false);
        } else {
             toast({
                title: "Utilizador Atualizado!",
                description: "Os dados do utilizador foram guardados.",
            });
        }
    }

    async function handleDelete() {
        setDeleting(true);
        const result = await deleteUser(userData.id);
        if (result && result.error) {
            toast({
                title: "Erro ao Apagar Utilizador",
                description: result.error,
                variant: "destructive"
            });
            setDeleting(false);
        } else {
             toast({
                title: "Utilizador Apagado!",
                description: "A conta do utilizador foi removida com sucesso.",
            });
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16 space-y-8">
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl">Editar Utilizador</CardTitle>
                            <CardDescription>
                            Atualize os detalhes do perfil, gira o nível ou remova o utilizador.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email do Utilizador</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rank_override"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nível Manual</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Selecione um nível para substituir o automático" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum (usar cálculo automático)</SelectItem>
                                        {ranks.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                    </Select>
                                    <FormDescription>Selecione um nível para ignorar o cálculo automático baseado em selos e submissões.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end">
                             <Button type="submit" size="lg" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Alterações
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </FormProvider>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-3"><Award/>Histórico de Selos</CardTitle>
                    <CardDescription>
                        Lista de todas as descobertas que este utilizador selou.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sealedDiscoveries.length > 0 ? (
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Descoberta</TableHead>
                            <TableHead>Distrito</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sealedDiscoveries.map((discovery) => (
                            <TableRow key={discovery.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/discoveries/${discovery.slug}`} className="hover:underline" target="_blank">
                                        {discovery.title}
                                    </Link>
                                </TableCell>
                                <TableCell><Badge variant="secondary">{discovery.district}</Badge></TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Este utilizador ainda não concedeu nenhum selo.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                 <CardHeader>
                    <CardTitle className="font-headline text-2xl text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>
                        Ações irreversíveis. Tenha cuidado ao proceder.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive"><Trash2 /> Apagar Utilizador</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isto irá apagar permanentemente a conta do utilizador <strong className="text-foreground">{userData.email}</strong> e todos os seus dados associados (selos, submissões).
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sim, apagar utilizador
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

        </div>
    );
}
