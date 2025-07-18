
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
import { regions, discoveryTypes, type Confraria } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { createSubmission } from '@/app/submit/actions';
import { useState } from 'react';

const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  type: z.enum(discoveryTypes, { required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  links: z.string().url('Por favor, insira um URL válido.').optional().or(z.literal('')),
  image: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmissionFormProps {
  confrarias: Confraria[];
}

export function SubmissionForm({ confrarias }: SubmissionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      editorial: '',
      region: undefined,
      type: undefined,
      confrariaId: '',
      links: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const result = await createSubmission(values);
    setLoading(false);

    if (result.error) {
        toast({
            title: "Erro ao Enviar",
            description: result.error,
            variant: "destructive"
        });
    } else {
        toast({
            title: "Submissão Enviada!",
            description: "A sua sugestão de descoberta foi enviada com sucesso para revisão.",
        });
        form.reset();
    }
  }

  return (
    <Form {...form} onSubmit={onSubmit} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Descoberta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Queijo da Serra da Estrela" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="editorial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Editorial</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva a sua descoberta de forma poética e pessoal..."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>Conte-nos porque é que esta descoberta é especial.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Região</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a região" />
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {discoveryTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="confrariaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confraria Sugerida (Opcional)</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Associe a uma confraria existente" />
                    </Trigger>
                  </FormControl>
                  <SelectContent>
                    {confrarias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              <FormDescription>Se aplicável, qual a confraria que melhor representa esta descoberta?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem (funcionalidade futura)</FormLabel>
              <FormControl>
                  <div className="relative">
                      <Input type="file" disabled className="opacity-0 absolute inset-0 w-full h-full z-10 cursor-pointer" {...field} />
                      <Button type="button" variant="outline" className="w-full" disabled>
                          <div className='flex items-center justify-center gap-2'>
                              <Upload className="h-4 w-4" />
                              <span>Carregar Imagem Autêntica</span>
                          </div>
                      </Button>
                  </div>
              </FormControl>
              <FormDescription>Uma boa imagem faz toda a diferença.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="links"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com" {...field} />
              </FormControl>
              <FormDescription>Website oficial, redes sociais, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submeter Descoberta
        </Button>
    </Form>
  );
}
