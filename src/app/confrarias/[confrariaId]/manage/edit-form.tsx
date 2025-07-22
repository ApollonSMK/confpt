
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PenSquare } from 'lucide-react';
import { updateConfrariaDetails } from './actions';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  id: z.number(),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  history: z.string().optional(),
  founders: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageConfrariaFormProps {
    confraria: {
        id: number;
        name: string;
        motto: string;
        history: string;
        founders: string;
    };
}

export function ManageConfrariaForm({ confraria }: ManageConfrariaFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: confraria.id,
            motto: confraria.motto,
            history: confraria.history,
            founders: confraria.founders,
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await updateConfrariaDetails(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Atualizar",
                description: result.error,
                variant: "destructive"
            });
        } else {
             toast({
                title: "Confraria Atualizada!",
                description: "Os detalhes da sua confraria foram guardados.",
            });
             router.refresh();
        }
        setLoading(false);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-3">
                    <PenSquare className="h-7 w-7 text-primary"/>
                    Editar Detalhes
                </CardTitle>
                <CardDescription>
                    Atualize as informações públicas da sua confraria que todos podem ver.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="motto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lema da Confraria</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="history"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>A Nossa História</FormLabel>
                                    <FormControl>
                                        <Textarea rows={8} placeholder="Conte a história, as origens e a missão da sua confraria..." {...field} />
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
                                    <FormLabel>Fundadores</FormLabel>
                                    <FormControl>
                                        <Textarea rows={4} placeholder="Liste os nomes dos membros fundadores..." {...field} />
                                    </FormControl>
                                    <FormDescription>Reconheça quem deu início a esta irmandade.</FormDescription>
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
    );
}
