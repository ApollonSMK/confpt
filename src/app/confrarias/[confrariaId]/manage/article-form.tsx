
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
import { Loader2, Send, Save, BookText, Image as ImageIcon } from 'lucide-react';
import { upsertArticle } from './actions';
import { useState, useRef } from 'react';
import type { Article } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5; // In MB

const formSchema = z.object({
  id: z.number().optional(),
  confraria_id: z.number(),
  author_id: z.string().uuid(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres.'),
  image: z.any()
    .refine((file) => !file || file?.size === undefined || file.size <= MAX_IMAGE_SIZE * 1024 * 1024, `O tamanho máximo é ${MAX_IMAGE_SIZE}MB.`)
    .refine((file) => !file || file?.type === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type), "Apenas são aceites os formatos .jpg, .jpeg, .png e .webp."),
});

type FormValues = z.infer<typeof formSchema>;

interface ArticleFormProps {
    confrariaId: number;
    authorId: string;
    article?: Article | null;
    onSuccess?: () => void;
}

export function ArticleForm({ confrariaId, authorId, article = null, onSuccess }: ArticleFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [statusToSave, setStatusToSave] = useState<'draft' | 'published'>('draft');
    const formRef = useRef<HTMLFormElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: article?.id,
            confraria_id: confrariaId,
            author_id: authorId,
            title: article?.title || '',
            content: article?.content || '',
            image: undefined,
        },
    });

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        formData.append('status', statusToSave);
        if (article?.image_url) {
            formData.append('current_image_url', article.image_url);
        }

        const result = await upsertArticle(formData);

        if (result && result.error) {
            toast({
                title: "Erro ao Guardar Publicação",
                description: result.error,
                variant: "destructive"
            });
        } else {
             toast({
                title: "Sucesso!",
                description: result.message,
            });
            if (onSuccess) onSuccess();
        }
        setLoading(false);
    }
    
    return (
        <FormProvider {...form}>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
                 <Card className="border-none shadow-none">
                    <CardContent className="space-y-6 pt-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><BookText className="h-4 w-4"/>Título da Publicação</FormLabel>
                                    <FormControl><Input {...field} placeholder="Um título cativante para a sua história" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Conteúdo</FormLabel>
                                    <FormControl><Textarea rows={12} placeholder="Escreva aqui o seu artigo, notícia ou história..." {...field} /></FormControl>
                                    <FormDescription>Pode usar Markdown para formatar o seu texto.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field: { onChange, ...rest } }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Imagem de Capa</FormLabel>
                                    {article?.image_url && (
                                        <div className="relative h-40 w-full rounded-md overflow-hidden border">
                                            <Image src={article.image_url} alt="Imagem de capa atual" layout="fill" objectFit="cover" />
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
                                    <FormDescription>Uma imagem de capa torna a sua publicação mais apelativa. Tamanho máximo: {MAX_IMAGE_SIZE}MB.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Hidden fields */}
                        <input type="hidden" {...form.register("id")} />
                        <input type="hidden" {...form.register("confraria_id")} />
                        <input type="hidden" {...form.register("author_id")} />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                        <Button type="submit" variant="outline" onClick={() => setStatusToSave('draft')} disabled={loading}>
                            {loading && statusToSave === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Guardar Rascunho
                        </Button>
                        <Button type="submit" onClick={() => setStatusToSave('published')} disabled={loading}>
                             {loading && statusToSave === 'published' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                            {article?.status === 'published' ? 'Atualizar Publicação' : 'Publicar'}
                        </Button>
                    </CardFooter>
                 </Card>
            </form>
        </FormProvider>
    );
}
