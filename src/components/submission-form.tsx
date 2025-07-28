
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
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5; // In MB

const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  links: z.string().url('Por favor, insira um URL válido.').optional().or(z.literal('')),
  image: z.any()
    .refine((file) => !file || file.size <= MAX_IMAGE_SIZE * 1024 * 1024, `O tamanho máximo é ${MAX_IMAGE_SIZE}MB.`)
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), "Apenas são aceites os formatos .jpg, .jpeg, .png e .webp."),
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
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      editorial: '',
      region: undefined,
      type_id: undefined,
      confrariaId: 'null',
      links: '',
      image: undefined,
    },
  });

  const { trigger } = form;

  const handleNextStep = async () => {
      const isValid = await trigger(["title", "editorial"]);
      if (isValid) {
          setStep(2);
      }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await createSubmission(formData);
    
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
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        
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
                            <FormLabel className="flex items-center gap-2"><Shield className="h-4 w-4"/>Relevante para a Confraria (Opcional)</FormLabel>
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
                            <FormDescription>Se esta descoberta tem uma ligação especial com alguma confraria, indique-a aqui. Isto ajuda os nossos curadores a organizar o conteúdo.</FormDescription>
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
                        render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Imagem Autêntica (Opcional)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/webp" 
                                        onChange={e => onChange(e.target.files ? e.target.files[0] : null)}
                                        {...rest}
                                    />
                                </FormControl>
                                <FormDescription>Uma boa imagem faz toda a diferença. O tamanho máximo é de {MAX_IMAGE_SIZE}MB.</FormDescription>
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
