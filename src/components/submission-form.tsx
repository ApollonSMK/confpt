

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { districts, type Confraria, DiscoveryType, portugalDistricts, amenities } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ArrowRight, PenSquare, Tag, MapPin, Globe, Shield, Image as ImageIcon, Phone, CheckSquare } from 'lucide-react';
import { createSubmission } from '@/app/submit/actions';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5; // In MB

const amenitySchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
});

const submissionSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.' }),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.' }),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('URL do website inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  amenities: z.array(amenitySchema).optional(),
});

// We add the image schema for client-side validation
const clientSchema = submissionSchema.extend({
    image: z.any()
        .refine((file) => !file || file?.size === undefined || file.size <= MAX_IMAGE_SIZE * 1024 * 1024, `O tamanho máximo é ${MAX_IMAGE_SIZE}MB.`)
        .refine((file) => !file || file?.type === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type), "Apenas são aceites os formatos .jpg, .jpeg, .png e .webp.")
        .optional(),
});


type FormValues = z.infer<typeof clientSchema>;

interface SubmissionFormProps {
  confrarias: Confraria[];
  discoveryTypes: DiscoveryType[];
}

export function SubmissionForm({ confrarias, discoveryTypes }: SubmissionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur', // Validate on blur for better user experience
    defaultValues: {
      title: '',
      editorial: '',
      district: undefined,
      municipality: undefined,
      type_id: undefined,
      confrariaId: 'null',
      address: '',
      website: '',
      phone: '',
      amenities: [],
      image: undefined,
    },
  });

  const { trigger, watch, setValue, control } = form;
  const selectedDistrict = watch('district');

  const { fields, append, remove } = useFieldArray({
      control,
      name: "amenities"
  });

  useEffect(() => {
    if (selectedDistrict && portugalDistricts[selectedDistrict as keyof typeof portugalDistricts]) {
        setMunicipalities(portugalDistricts[selectedDistrict as keyof typeof portugalDistricts]);
        setValue('municipality', ''); // Reset municipality when district changes
    } else {
        setMunicipalities([]);
    }
  }, [selectedDistrict, setValue]);

  const handleNextStep = async () => {
      const isValid = await trigger(["title", "editorial"]);
      if (isValid) {
          setStep(2);
      }
  }

  // onSubmit now uses the form's values directly
  async function onSubmit(values: FormValues) {
    setLoading(true);

    const { image, ...submissionData } = values;
    
    // We pass the data and the image file separately to the server action
    const result = await createSubmission(submissionData, image);
    
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
    <Form {...form}>
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
                            name="district"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Distrito</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Concelho</FormLabel>
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
                        <FormField
                            control={form.control}
                            name="type_id"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4"/>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormField
                            control={form.control}
                            name="confrariaId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2"><Shield className="h-4 w-4"/>Confraria Relevante</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Associe a uma confraria" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="null">Nenhuma (comunitária)</SelectItem>
                                    {confrarias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                    </div>
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Morada (Opcional)</FormLabel>
                            <FormControl><Input placeholder="Rua, número, código postal" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/>Website (Opcional)</FormLabel>
                              <FormControl><Input placeholder="https://exemplo.com" {...field} /></FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                       <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4"/>Telefone (Opcional)</FormLabel>
                              <FormControl><Input placeholder="Contacto telefónico" {...field} /></FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                    </div>
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
                                    />
                                </FormControl>
                                <FormDescription>Uma boa imagem faz toda a diferença. O tamanho máximo é de {MAX_IMAGE_SIZE}MB.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><CheckSquare className="h-4 w-4"/>Comodidades (Opcional)</FormLabel>
                        <FormDescription>Selecione as comodidades que se aplicam a esta descoberta, se for o caso.</FormDescription>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {amenities.map((amenity) => (
                                <FormField
                                    key={amenity.id}
                                    control={control}
                                    name="amenities"
                                    render={() => {
                                        return (
                                        <FormItem
                                            key={amenity.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={fields.some(a => a.id === amenity.id)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? append(amenity)
                                                    : remove(fields.findIndex(a => a.id === amenity.id))
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {amenity.label}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                />
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                </CardContent>
                <CardFooter className="flex justify-between">
                      <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                        Voltar
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Enviar para Revisão
                    </Button>
                </CardFooter>
            </Card>
        )}
      </form>
    </Form>
  );
}
