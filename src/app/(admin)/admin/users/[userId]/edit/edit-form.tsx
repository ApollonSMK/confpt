
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateUser } from './actions';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';

const formSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
    userData: User;
}

export function EditUserForm({ userData }: EditUserFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: userData.id,
            email: userData.email,
            full_name: userData.user_metadata?.full_name || '',
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
        } else {
             toast({
                title: "Utilizador Atualizado!",
                description: "Os dados do utilizador foram guardados.",
            });
        }
        setLoading(false);
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Editar Utilizador</CardTitle>
                        <CardDescription>
                           Atualize os detalhes do perfil do utilizador.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
