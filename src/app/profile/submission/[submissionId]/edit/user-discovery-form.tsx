
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
import { districts, type Confraria, DiscoveryType, portugalDistricts, Discovery } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, Camera } from 'lucide-react';
import { updateUserDiscovery } from './actions';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

const MAX_IMAGE_SIZE = 5;
const MAX_IMAGES = 5;

const editDiscoverySchema = z.object({
  discoveryId: z.number(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.' }),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.' }),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  website: z.string().url('URL inválido').optional().or(z.literal('')),
});

const clientSchema = editDiscoverySchema.extend({
    images: z.any()
        .refine((files) => !files || files.length <= MAX_IMAGES, `Pode carregar no máximo ${MAX_IMAGES} imagens.`)
        .refine((files) => !files || Array.from(files).every((file: any) => file.size <= MAX_IMAGE_SIZE * 1024 * 1024), `O tamanho máximo por imagem é ${MAX_IMAGE_SIZE}MB.`)
        .optional(),
});

type FormValues = z.infer<typeof clientSchema>;

interface EditDiscoveryFormProps {
  discovery: Discovery;
  confrarias: Confraria[];
  discoveryTypes: DiscoveryType[];
}

export function UserDiscoveryForm({ discovery, confrarias, discoveryTypes }: EditDiscoveryFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
    defaultValues: {
      discoveryId: discovery.id,
      title: discovery.title || '',
      editorial: discovery.editorial || '',
      district: discovery.district as any,
      municipality: discovery.municipality || undefined,
      type_id: String(discovery.type_id),
      confrariaId: String(discovery.confraria_id || 'null'),
      website: discovery.website || '',
      images: undefined,
    },
  });

  const { watch, setValue } = form;
  const selectedDistrict = watch('district');

  useEffect(() => {
    if (selectedDistrict && portugalDistricts[selectedDistrict as keyof typeof portugalDistricts]) {
        setMunicipalities(portugalDistricts[selectedDistrict as keyof typeof portugalDistricts]);
        const currentMunicipality = form.getValues('municipality');
        if (!portugalDistricts[selectedDistrict as keyof typeof portugalDistricts].includes(currentMunicipality as string)) {
             setValue('municipality', '');
        }
    } else {
        setMunicipalities([]);
    }
  }, [selectedDistrict, setValue, form]);

  useEffect(() => {
      if (discovery.district && portugalDistricts[discovery.district as keyof typeof portugalDistricts]) {
          setMunicipalities(portugalDistricts[discovery.district as keyof typeof portugalDistricts]);
      }
  }, [discovery.district]);
  
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
    const result = await updateUserDiscovery(values);
    setLoading(false);

    if (result?.error) {
        toast({
            title: "Erro ao Atualizar",
            description: result.error,
            variant: "destructive"
        });
    } else {
        toast({
            title: "Descoberta Atualizada!",
            description: "A sua descoberta foi atualizada com sucesso.",
        });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Editar Descoberta</CardTitle>
        <CardDescription>
          Ajuste os detalhes da sua descoberta. A sua contribuição é importante para manter a informação precisa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Distrito</FormLabel>
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
                        <FormLabel>Concelho</FormLabel>
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
            </div>
             <FormField
                control={form.control}
                name="type_id"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo</FormLabel>
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
                    <FormLabel>Confraria Associada (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Associe a uma confraria" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="null">Nenhuma</SelectItem>
                            {confrarias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Website de Referência (Opcional)</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Camera className="h-4 w-4"/>Adicionar à Galeria</FormLabel>
                   <FormDescription>As imagens atuais da galeria estão abaixo. Pode adicionar mais aqui. A primeira imagem da galeria será a imagem de capa.</FormDescription>
                    <FormControl>
                        <Input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            multiple
                            onChange={handleFileChange}
                        />
                    </FormControl>
                  <FormMessage />
                   {(imagePreviews.length > 0 || discovery.images.length > 0) && (
                       <div className="space-y-2 pt-2">
                           <h3 className="text-sm font-medium text-muted-foreground">Galeria Atual e Novas Imagens:</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4">
                                {discovery.images.map((image, index) => (
                                    <div key={`current-${index}`} className="relative aspect-square">
                                        <Image src={image.imageUrl} alt={image.imageHint || 'Imagem existente'} fill className="object-cover rounded-md" />
                                    </div>
                                ))}
                                {imagePreviews.map((src, index) => (
                                    <div key={`new-${index}`} className="relative aspect-square">
                                        <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover rounded-md border-2 border-dashed border-primary" />
                                    </div>
                                ))}
                            </div>
                       </div>
                    )}
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center pt-4">
              <Button asChild variant="ghost">
                <Link href="/profile">
                  <ArrowLeft className="mr-2 h-4 w-4"/>
                  Cancelar e Voltar ao Perfil
                </Link>
              </Button>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Alterações
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

    