

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider, Controller, useFieldArray } from 'react-hook-form';
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
import { districts, Confraria, Discovery, DiscoveryType, amenities, type Amenity, portugalDistricts } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Camera, PlusCircle } from 'lucide-react';
import { deleteDiscovery, updateDiscovery, addDiscoveryImage, deleteDiscoveryImage } from './actions';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { AddressAutocomplete } from '@/components/address-autocomplete';


const amenitySchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
});

const formSchema = z.object({
  id: z.number(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(3, 'A descrição curta deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'O editorial deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.'}),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.'}),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confraria_id: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("URL do website inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
  amenities: z.array(amenitySchema).optional(),
});


type FormValues = z.infer<typeof formSchema>;

interface EditDiscoveryFormProps {
    discovery: Discovery;
    confrarias: Confraria[];
    discoveryTypes: DiscoveryType[];
    mapboxApiKey: string;
}

export function EditDiscoveryForm({ discovery, confrarias, discoveryTypes, mapboxApiKey }: EditDiscoveryFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [municipalities, setMunicipalities] = useState<string[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: discovery.id,
            title: discovery.title,
            description: discovery.description,
            editorial: discovery.editorial,
            district: discovery.district as any,
            municipality: discovery.municipality,
            type_id: String(discovery.type_id),
            confraria_id: discovery.confraria_id?.toString() ?? 'null',
            address: discovery.address ?? '',
            website: discovery.website ?? '',
            phone: discovery.phone ?? '',
            amenities: discovery.amenities || [],
        },
    });
    
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "amenities"
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


    async function onSubmit(values: FormValues) {
        setLoading(true);
        const result = await updateDiscovery(values);

        if (result && result.error) {
            toast({
                title: "Erro ao Atualizar Descoberta",
                description: result.error,
                variant: "destructive"
            });
        }
        setLoading(false);
    }
    
    async function handleDelete() {
        setDeleting(true);
        const result = await deleteDiscovery(discovery.id);
        if (result && result.error) {
            toast({
                title: "Erro ao Apagar Descoberta",
                description: result.error,
                variant: "destructive"
            });
            setDeleting(false);
        } else {
            toast({
                title: "Descoberta Apagada!",
                description: "A descoberta foi removida com sucesso.",
            });
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
             <div className="max-w-2xl mx-auto space-y-8">
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-3xl">Editar Descoberta</CardTitle>
                                    <CardDescription>
                                    Atualize os detalhes da descoberta.
                                    </CardDescription>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isto irá apagar permanentemente a descoberta e todos os seus dados associados.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Sim, apagar descoberta
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Descrição Curta</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormDescription>Um resumo para os cartões.</FormDescription><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="editorial" render={({ field }) => (
                                    <FormItem><FormLabel>Editorial</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormDescription>O texto principal da descoberta.</FormDescription><FormMessage /></FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="district" render={({ field }) => (
                                    <FormItem><FormLabel>Distrito</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="municipality" render={({ field }) => (
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
                                )}/>
                                </div>
                                <FormField control={form.control} name="type_id" render={({ field }) => (
                                    <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{discoveryTypes.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="confraria_id" render={({ field }) => (
                                    <FormItem><FormLabel>Confraria (Opcional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Associar a uma confraria" /></SelectTrigger></FormControl><SelectContent><SelectItem value="null">Nenhuma (Comunitário)</SelectItem>{confrarias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Morada (Opcional)</FormLabel>
                                        <FormControl>
                                            <AddressAutocomplete
                                                apiKey={mapboxApiKey}
                                                onSelect={(address) => setValue('address', address)}
                                                initialValue={field.value}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="website" render={({ field }) => (
                                    <FormItem><FormLabel>Website (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>

                                    <FormItem>
                                    <FormLabel>Comodidades</FormLabel>
                                    <FormDescription>Selecione as comodidades que esta descoberta oferece.</FormDescription>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        {amenities.map((amenity) => (
                                            <FormField
                                                key={amenity.id}
                                                control={form.control}
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
                                
                                <Button type="submit" size="lg" disabled={loading} className="w-full">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Alterações
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                </FormProvider>
                <ImageGalleryManager discovery={discovery} />
            </div>
        </div>
    );
}

function ImageGalleryManager({ discovery }: { discovery: Discovery }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const imageHintRef = useRef<HTMLInputElement>(null);

    const handleAddImage = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        
        const result = await addDiscoveryImage(formData);

        if (result.error) {
            toast({ title: "Erro", description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso', description: result.message });
            formRef.current?.reset();
        }
        setLoading(false);
    }

    const handleDeleteImage = async (id: number) => {
        const result = await deleteDiscoveryImage(id, discovery.id, discovery.slug);
        if (result.error) {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso', description: 'Imagem removida.' });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Camera/>Gerir Galeria de Imagens</CardTitle>
                <CardDescription>Adicione e remova imagens da galeria desta descoberta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <form ref={formRef} onSubmit={handleAddImage} className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold">Adicionar Nova Imagem</h3>
                    <input type="hidden" name="discoveryId" value={discovery.id} />
                    <input type="hidden" name="slug" value={discovery.slug} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                            <FormLabel>Ficheiro</FormLabel>
                            <FormControl><Input type="file" name="image" required /></FormControl>
                        </FormItem>
                        <FormItem>
                            <FormLabel>Dica de Imagem (IA)</FormLabel>
                            <FormControl><Input name="imageHint" placeholder="Ex: prato comida" /></FormControl>
                        </FormItem>
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="animate-spin mr-2" />}
                        <PlusCircle/> Adicionar
                    </Button>
                </form>

                <div className="space-y-4">
                    <h3 className="font-semibold">Imagens Atuais</h3>
                    {discovery.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {discovery.images.map((image, index) => (
                                <div key={index} className="relative group">
                                    <Image src={image.imageUrl} alt={image.imageHint || `Imagem ${index + 1}`} width={200} height={200} className="rounded-md object-cover aspect-square"/>
                                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon"><Trash2 /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Apagar Imagem?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteImage((image as any).id)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                     </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Ainda não há imagens na galeria.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
