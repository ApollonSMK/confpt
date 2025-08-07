
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
import { Loader2, Send, ArrowRight, PenSquare, Tag, MapPin, Globe, Shield, Image as ImageIcon, Phone, CheckSquare, Trash2, Camera } from 'lucide-react';
import { createSubmission } from '@/app/submit/actions';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import Image from 'next/image';
import { AddressAutocomplete } from './address-autocomplete';

const MAX_IMAGE_SIZE = 5; // In MB
const MAX_IMAGES = 5; // Max number of images in the gallery

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

const clientSchema = submissionSchema.extend({
    images: z.any()
      .refine((files) => !files || files.length <= MAX_IMAGES, `Pode carregar no máximo ${MAX_IMAGES} imagens.`)
      .refine((files) => !files || Array.from(files).every((file: any) => file.size <= MAX_IMAGE_SIZE * 1024 * 1024), `O tamanho máximo por imagem é ${MAX_IMAGE_SIZE}MB.`)
      .optional(),
});

type FormValues = z.infer<typeof clientSchema>;

interface SubmissionFormProps {
  confrarias: Confraria[];
  discoveryTypes: DiscoveryType[];
  mapboxApiKey: string;
}

export function SubmissionForm({ confrarias, discoveryTypes, mapboxApiKey }: SubmissionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
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
      images: undefined,
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
        setValue('municipality', '');
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        form.setValue("images", files);
        const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
        setImagePreviews(newPreviews);
    }
  };

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
        setImagePreviews([]);
        setStep(1);
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
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
                        control={control}
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
                        control={control}
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
                            control={control}
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
                            control={control}
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
                            control={control}
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
                            control={control}
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
                        control={control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Morada (Opcional)</FormLabel>
                             <AddressAutocomplete 
                                apiKey={mapboxApiKey} 
                                onSelect={(address) => setValue('address', address)}
                                initialValue={field.value}
                             />
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                          control={control}
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
                          control={control}
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
                        control={control}
                        name="images"
                        render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Camera className="h-4 w-4"/>Galeria de Imagens (Opcional)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/webp" 
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </FormControl>
                                <FormDescription>Pode carregar até {MAX_IMAGES} imagens. A primeira será a imagem de capa. Máx {MAX_IMAGE_SIZE}MB cada.</FormDescription>
                                <FormMessage />
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4">
                                        {imagePreviews.map((src, index) => (
                                            <div key={index} className="relative aspect-square">
                                                <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover rounded-md" />
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={amenity.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.some(a => a.id === amenity.id)}
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
    </Form>
  );
}
