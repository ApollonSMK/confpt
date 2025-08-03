
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Save, BookText, Image as ImageIcon, Utensils, ListOrdered, ChefHat, ArrowRight, ArrowLeft } from 'lucide-react';
import { upsertRecipe } from './actions';
import { useState, useRef } from 'react';
import type { Recipe } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5; // In MB

const formSchema = z.object({
  id: z.number().optional(),
  confraria_id: z.number(),
  author_id: z.string().uuid(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  ingredients: z.string().min(10, 'Os ingredientes devem ter pelo menos 10 caracteres.'),
  instructions: z.string().min(10, 'As instruções devem ter pelo menos 10 caracteres.'),
  image: z.any()
    .refine((file) => !file || file?.size === undefined || file.size <= MAX_IMAGE_SIZE * 1024 * 1024, `O tamanho máximo é ${MAX_IMAGE_SIZE}MB.`)
    .refine((file) => !file || file?.type === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type), "Apenas são aceites os formatos .jpg, .jpeg, .png e .webp."),
});

type FormValues = z.infer<typeof formSchema>;

interface RecipeFormProps {
    confrariaId: number;
    authorId: string;
    recipe?: Recipe | null;
    onSuccess?: () => void;
}

export function RecipeForm({ confrariaId, authorId, recipe = null, onSuccess }: RecipeFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [statusToSave, setStatusToSave] = useState<'draft' | 'published'>('draft');
    const [step, setStep] = useState(1);
    const formRef = useRef<HTMLFormElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: recipe?.id,
            confraria_id: confrariaId,
            author_id: authorId,
            title: recipe?.title || '',
            description: recipe?.description || '',
            ingredients: recipe?.ingredients || '',
            instructions: recipe?.instructions || '',
            image: undefined,
        },
    });

    const { trigger } = form;

    const handleNextStep = async (fields: (keyof FormValues)[]) => {
        const isValid = await trigger(fields);
        if (isValid) {
            setStep(prev => prev + 1);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        formData.append('status', statusToSave);
        if (recipe?.image_url) {
            formData.append('current_image_url', recipe.image_url);
        }

        const result = await upsertRecipe(formData);

        if (result && result.error) {
            toast({
                title: "Erro ao Guardar Receita",
                description: result.error,
                variant: "destructive"
            });
             setLoading(false);
        } else {
             toast({
                title: "Sucesso!",
                description: result.message,
            });
            if (onSuccess) onSuccess();
        }
    }
    
    return (
        <FormProvider {...form}>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
                 {/* Hidden fields */}
                <input type="hidden" {...form.register("id")} />
                <input type="hidden" {...form.register("confraria_id")} />
                <input type="hidden" {...form.register("author_id")} />

                {step === 1 && (
                     <Card className="border-none shadow-none">
                         <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center justify-between">
                                <span>Passo 1: A Essência da Receita</span>
                                <span className="text-sm font-normal text-muted-foreground">1 de 3</span>
                            </CardTitle>
                            <CardDescription>Comece por dar um nome e uma pequena história à sua receita.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Utensils className="h-4 w-4"/>Título da Receita</FormLabel>
                                    <FormControl><Input {...field} placeholder="Ex: Arroz de Marisco à Moda da Confraria" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><BookText className="h-4 w-4"/>Descrição</FormLabel>
                                    <FormControl><Textarea rows={4} placeholder="Uma pequena introdução ou história sobre esta receita..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                        <CardFooter>
                            <Button type="button" onClick={() => handleNextStep(['title', 'description'])} size="lg" className="ml-auto">
                                Continuar <ArrowRight className="ml-2"/>
                            </Button>
                        </CardFooter>
                     </Card>
                )}

                {step === 2 && (
                     <Card className="border-none shadow-none">
                         <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center justify-between">
                                <span>Passo 2: O Coração do Prato</span>
                                <span className="text-sm font-normal text-muted-foreground">2 de 3</span>
                            </CardTitle>
                            <CardDescription>Liste os ingredientes necessários e os passos para a preparação.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="ingredients" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><ListOrdered className="h-4 w-4"/>Ingredientes</FormLabel>
                                    <FormControl><Textarea rows={8} placeholder="Liste os ingredientes, um por linha para melhor leitura." {...field} /></FormControl>
                                    <FormDescription>Ex: 1kg de Amêijoas</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="instructions" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><ChefHat className="h-4 w-4"/>Instruções</FormLabel>
                                    <FormControl><Textarea rows={10} placeholder="Descreva o passo a passo da preparação." {...field} /></FormControl>
                                    <FormDescription>Pode numerar os passos para maior clareza.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                         <CardFooter className="flex justify-between">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                                <ArrowLeft className="mr-2"/> Voltar
                            </Button>
                            <Button type="button" onClick={() => handleNextStep(['ingredients', 'instructions'])} size="lg">
                                Continuar <ArrowRight className="ml-2"/>
                            </Button>
                        </CardFooter>
                     </Card>
                )}

                 {step === 3 && (
                     <Card className="border-none shadow-none">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center justify-between">
                                <span>Passo 3: O Toque Final</span>
                                <span className="text-sm font-normal text-muted-foreground">3 de 3</span>
                            </CardTitle>
                            <CardDescription>Adicione uma foto do prato finalizado para abrir o apetite e publique a sua obra-prima.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field: { onChange, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Imagem do Prato</FormLabel>
                                        {recipe?.image_url && (
                                            <div className="relative h-40 w-full rounded-md overflow-hidden border">
                                                <Image src={recipe.image_url} alt="Imagem de capa atual" layout="fill" objectFit="cover" />
                                            </div>
                                        )}
                                        <FormControl>
                                            <Input 
                                                type="file" 
                                                accept="image/png, image/jpeg, image/webp" 
                                                onChange={e => onChange(e.target.files ? e.target.files[0] : null)}
                                                {...rest}
                                            />
                                        </FormControl>
                                        <FormDescription>Uma imagem do prato finalizado. Tamanho máximo: {MAX_IMAGE_SIZE}MB.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                                <ArrowLeft className="mr-2"/> Voltar
                            </Button>
                            <div className="flex gap-4">
                                <Button type="submit" variant="outline" onClick={() => setStatusToSave('draft')} disabled={loading}>
                                    {loading && statusToSave === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                    Guardar Rascunho
                                </Button>
                                <Button type="submit" onClick={() => setStatusToSave('published')} disabled={loading}>
                                    {loading && statusToSave === 'published' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                    {recipe?.status === 'published' ? 'Atualizar Receita' : 'Publicar Receita'}
                                </Button>
                            </div>
                        </CardFooter>
                     </Card>
                )}
            </form>
        </FormProvider>
    );
}
