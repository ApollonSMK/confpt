
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
import { Loader2 } from 'lucide-react';
import { updateSettings } from './actions';
import { useState } from 'react';

const formSchema = z.object({
  mapbox_api_key: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
    settings: {
        mapbox_api_key: string;
    }
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mapbox_api_key: settings.mapbox_api_key || '',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await updateSettings(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Guardar Definições",
                description: result.error,
                variant: "destructive"
            });
        } else {
             toast({
                title: "Definições Guardadas!",
                description: result.message,
            });
        }
        setLoading(false);
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="mapbox_api_key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chave de API Pública do Mapbox</FormLabel>
                            <FormControl>
                                <Input placeholder="pk.ey..." {...field} />
                            </FormControl>
                            <FormDescription>
                                A sua chave de acesso pública (não a secreta) do Mapbox. Essencial para mostrar os mapas.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Definições
                </Button>
            </form>
        </FormProvider>
    );
}
