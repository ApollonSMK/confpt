
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
import { regions, type Confraria, DiscoveryType } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Send, ArrowRight, PenSquare, Tag, MapPin, Link as LinkIcon, Shield, Image as ImageIcon } from 'lucide-react';
import { createSubmission } from '@/app/submit/actions';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  links: z.string().url('Por favor, insira um URL válido.').optional().or(z.literal('')),
  image: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmissionFormProps {
  confrarias: Confraria[];
  discoveryTypes: DiscoveryType[];
}

export function SubmissionForm({ confrarias, discoveryTypes }: SubmissionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      editorial: '',
      region: undefined,
      type_id: undefined,
      confrariaId: 'null',
      links: '',
    },
  });

  const { trigger } = form;

  const handleNextStep = async () => {
      const isValid = await trigger(["title", "editorial"]);
      if (isValid) {
          setStep(2);
      }
  }

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
        setStep(1);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {step === 1 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center justify-between">
                        <span>Passo 1: A Descoberta Essencial</span>
                        <span className="text-sm font-normal text-muted-foreground">1 de 2</span>
                    </CardTitle>
                    <CardDescription>Comece pelo mais importante: o nome e a história que tornam este lugar, produto ou pessoa especial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><PenSquare className="h-4 w-4"/>Título da Descoberta</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: O segredo das amêijoas à Bulhão Pato" {...field} />
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
                            <FormLabel className="flex items-center gap-2"><PenSquare className="h-4 w-4"/>Descrição Editorial</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Descreva a sua descoberta de forma poética e pessoal..."
                                rows={8}
                                {...field}
                                />
                            </FormControl>
                            <FormDescription>Conte-nos porque é que esta descoberta é especial. Pense nisto como uma página de uma revista.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                <CardFooter>
                    <Button type="button" onClick={handleNextStep} size="lg" className="ml-auto">
                        Continuar <ArrowRight className="ml-2"/>
                    </Button>
                </CardFooter>
            </Card>
        )}

        {step === 2 && (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center justify-between">
                        <span>Passo 2: Detalhes e Contexto</span>
                        <span className="text-sm font-normal text-muted-foreground">2 de 2</span>
                    </CardTitle>
                    <CardDescription>Agora, ajude-nos a categorizar e a dar mais informações sobre a sua descoberta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="region"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Região</FormLabel>
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
                            name="type_id"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4"/>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {discoveryTypes.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
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
                            <FormLabel className="flex items-center gap-2"><Shield className="h-4 w-4"/>Confraria Sugerida (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Associe a uma confraria existente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="null">Nenhuma (contribuição comunitária)</SelectItem>
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
                        name="links"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><LinkIcon className="h-4 w-4"/>Link de Referência (Opcional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://exemplo.com" {...field} />
                            </FormControl>
                            <FormDescription>Website oficial, artigo de jornal, redes sociais, etc.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Imagem Autêntica (funcionalidade futura)</FormLabel>
                            <FormControl>
                                <div className="relative flex items-center justify-center w-full">
                                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-not-allowed bg-muted/50 hover:bg-muted/80 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                                            <Upload className="w-8 h-8 mb-2"/>
                                            <p className="mb-2 text-sm">Carregar uma imagem</p>
                                            <p className="text-xs ">(Funcionalidade em desenvolvimento)</p>
                                        </div>
                                        <Input type="file" disabled className="hidden" {...field} />
                                    </div>
                                </div>
                            </FormControl>
                            <FormDescription>Uma boa imagem faz toda a diferença.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                        Voltar
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2" />}
                        Enviar para Revisão
                    </Button>
                </CardFooter>
            </Card>
        )}
      </form>
    </FormProvider>
  );
}
