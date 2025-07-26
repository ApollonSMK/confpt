
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
import { createType } from './actions';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, 'O nome do tipo deve ter pelo menos 2 caracteres.'),
});

type FormValues = z.infer<typeof formSchema>;

export function AddTypeForm() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await createType(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Adicionar Tipo",
                description: result.error,
                variant: "destructive"
            });
        } else {
             toast({
                title: "Tipo Adicionado!",
                description: `O tipo "${values.name}" foi criado com sucesso.`,
            });
            form.reset();
        }
        setLoading(false);
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Novo Tipo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Bebida Espirituosa" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar Tipo
                </Button>
            </form>
        </FormProvider>
    );
}
