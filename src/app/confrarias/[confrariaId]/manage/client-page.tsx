

'use client';

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect, useRouter, useSearchParams } from 'next/navigation';
import { ManageConfrariaForm } from './edit-form';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, PenSquare, LayoutDashboard, PlusCircle, Edit, MapPin, Trash2, Loader2, ArrowLeft, Newspaper, Camera, UtensilsCrossed, Shield } from 'lucide-react';
import { addGalleryImage, deleteArticle, deleteEvent, deleteRecipe, deleteGalleryImage } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { districts } from '@/lib/data';
import { EventForm } from './event-form';
import { ArticleForm } from './article-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Event, Article, Recipe, ConfrariaGalleryImage } from '@/lib/data';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useRef, useEffect, useCallback, Suspense, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RecipeForm } from './recipe-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFormStatus } from 'react-dom';


const ImageCropModal = dynamic(() => import('./image-upload-modals').then(mod => mod.ImageCropModal), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
});

type ConfrariaDataType = {
    id: number;
    name: string;
    motto: string;
    history: string;
    founders: string;
    district: (typeof districts)[number];
    seal_url: string;
    cover_url: string;
}

export type ManageConfrariaPageProps = {
    confrariaData: ConfrariaDataType;
    events: Event[];
    articles: Article[];
    recipes: Recipe[];
    galleryImages: ConfrariaGalleryImage[];
    user: User;
    mapboxApiKey: string;
}

// Client component to handle state and interactions
export function ClientManagePage({ confrariaData, events, articles, recipes, galleryImages, user, mapboxApiKey }: ManageConfrariaPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isEventDialogOpen, setEventDialogOpen] = useState(false);
    const [isArticleDialogOpen, setArticleDialogOpen] = useState(false);
    const [isRecipeDialogOpen, setRecipeDialogOpen] = useState(false);
    
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const [isDeletingArticle, setIsDeletingArticle] = useState<number | null>(null);
    const [isDeletingEvent, setIsDeletingEvent] = useState<number | null>(null);
    const [isDeletingRecipe, setIsDeletingRecipe] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

     useEffect(() => {
        // Update URL when tab changes without reloading the page
        const newUrl = `${window.location.pathname}?tab=${activeTab}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }, [activeTab]);

    const handleEditEventClick = (event: Event) => {
        setSelectedEvent(event);
        setEventDialogOpen(true);
    };

    const handleAddNewEventClick = () => {
        setSelectedEvent(null);
        setEventDialogOpen(true);
    };

    const handleEventFormSuccess = () => {
        setEventDialogOpen(false);
        router.refresh(); 
    };
    
    const handleDeleteEvent = async (event: Event) => {
        setIsDeletingEvent(event.id);
        const result = await deleteEvent(event.id, confrariaData.id);
        if (result.error) {
            toast({ title: 'Erro ao Apagar', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Evento Apagado', description: `O evento "${event.name}" foi apagado com sucesso.`});
            router.refresh();
        }
        setIsDeletingEvent(null);
    };

    const handleEditArticleClick = (article: Article) => {
        setSelectedArticle(article);
        setArticleDialogOpen(true);
    };

    const handleAddNewArticleClick = () => {
        setSelectedArticle(null);
        setArticleDialogOpen(true);
    };

    const handleArticleFormSuccess = () => {
        setArticleDialogOpen(false);
        router.refresh();
    };
    
    const handleDeleteArticle = async (article: Article) => {
        setIsDeletingArticle(article.id);
        const result = await deleteArticle(article.id, confrariaData.id);
        if (result.error) {
            toast({ title: 'Erro ao Apagar', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Publicação Apagada', description: `"${article.title}" foi apagada com sucesso.`});
            router.refresh();
        }
        setIsDeletingArticle(null);
    }

    const handleEditRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setRecipeDialogOpen(true);
    };

    const handleAddNewRecipeClick = () => {
        setSelectedRecipe(null);
        setRecipeDialogOpen(true);
    };

    const handleRecipeFormSuccess = () => {
        setRecipeDialogOpen(false);
        router.refresh();
    };

    const handleDeleteRecipe = async (recipe: Recipe) => {
        setIsDeletingRecipe(recipe.id);
        const result = await deleteRecipe(recipe.id, confrariaData.id);
        if (result.error) {
            toast({ title: 'Erro ao Apagar', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Receita Apagada', description: `A receita "${recipe.title}" foi apagada.` });
            router.refresh();
        }
        setIsDeletingRecipe(null);
    };
    
    const handleDeleteGalleryImage = async (id: number) => {
         const result = await deleteGalleryImage(id, confrariaData.id);
         if (result.error) {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso', description: `Imagem removida da galeria.` });
            router.refresh();
        }
    }


    return (
        <div className="container mx-auto px-4 py-8 md:py-16 space-y-8">
            <Button variant="ghost" asChild className="-ml-4">
                <Link href={`/confrarias/${confrariaData.id}`}>
                    <ArrowLeft />
                    Voltar à Página da Confraria
                </Link>
            </Button>
            <div>
                 <h1 className="font-headline text-4xl md:text-5xl font-bold mb-2">Painel da {confrariaData.name}</h1>
                <p className="text-lg text-muted-foreground">
                    Bem-vindo, Confrade Responsável. Gira a sua confraria a partir daqui.
                </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-6">
                    <TabsTrigger value="details"><PenSquare className="mr-2 h-4 w-4"/>Detalhes</TabsTrigger>
                    <TabsTrigger value="images"><Camera className="mr-2 h-4 w-4"/>Imagens</TabsTrigger>
                    <TabsTrigger value="events">
                        <Calendar className="mr-2 h-4 w-4"/>
                        Eventos
                        {events.length > 0 && <Badge className="ml-2">{events.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="articles">
                        <Newspaper className="mr-2 h-4 w-4"/>
                        Publicações
                        {articles.length > 0 && <Badge className="ml-2">{articles.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="gallery">
                        <Camera className="mr-2 h-4 w-4"/>
                        Galeria
                        {galleryImages.length > 0 && <Badge className="ml-2">{galleryImages.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="recipes">
                        <UtensilsCrossed className="mr-2 h-4 w-4"/>
                        Receitas
                        {recipes.length > 0 && <Badge className="ml-2">{recipes.length}</Badge>}
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-6">
                    <TabContentCard title="Editar Detalhes" description="Atualize as informações públicas da sua confraria que todos podem ver." icon={PenSquare}>
                        <ManageConfrariaForm confraria={confrariaData} />
                    </TabContentCard>
                </TabsContent>
                
                 <TabsContent value="images" className="mt-6">
                    <TabContentCard title="Gerir Imagens" description="Altere o selo e a imagem de capa da sua confraria." icon={Camera}>
                        <ImageUploader confraria={confrariaData} />
                    </TabContentCard>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                    <TabContentCard 
                        title="Gestão de Eventos" 
                        description="Crie e gira os eventos e encontros da sua confraria." 
                        icon={Calendar}
                        actions={
                            <Dialog open={isEventDialogOpen} onOpenChange={setEventDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleAddNewEventClick}><PlusCircle/> Adicionar Evento</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle className="font-headline text-2xl">{selectedEvent ? 'Editar Evento' : 'Adicionar Novo Evento'}</DialogTitle>
                                        <DialogDescription>
                                            Preencha os detalhes para agendar um novo encontro para os seus confrades e para a comunidade.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <EventForm 
                                        confrariaId={confrariaData.id} 
                                        confrariaRegion={confrariaData.district} 
                                        event={selectedEvent} 
                                        onSuccess={handleEventFormSuccess}
                                        mapboxApiKey={mapboxApiKey}
                                    />
                                </DialogContent>
                            </Dialog>
                        }>
                        {events.length > 0 ? (
                            <div className="space-y-4">
                                {events.map(event => (
                                    <Card key={event.id} className="flex items-center p-4 gap-4">
                                        <Image src={event.image_url ?? 'https://placehold.co/100x100.png'} alt={event.name} width={80} height={80} className="rounded-md object-cover" data-ai-hint={event.image_hint ?? 'event'} />
                                        <div className="flex-grow">
                                            <h3 className="font-bold">{event.name}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(event.event_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location || 'Local a confirmar'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleEditEventClick(event)}><Edit className="h-4 w-4"/></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" disabled={isDeletingEvent === event.id}>
                                                        {isDeletingEvent === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Apagar Evento?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tem a certeza que quer apagar o evento &quot;{event.name}&quot;? Esta ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteEvent(event)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="font-semibold text-lg">Nenhum evento agendado.</p>
                                <p>Crie o seu primeiro evento para juntar os confrades.</p>
                            </div>
                        )}
                    </TabContentCard>
                </TabsContent>

                <TabsContent value="articles" className="mt-6">
                    <TabContentCard 
                        title="Gestão de Publicações" 
                        description="Escreva e gira artigos, notícias e histórias para a sua comunidade." 
                        icon={Newspaper}
                        actions={
                             <Dialog open={isArticleDialogOpen} onOpenChange={setArticleDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleAddNewArticleClick}><PlusCircle/> Nova Publicação</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="font-headline text-2xl">{selectedArticle ? 'Editar Publicação' : 'Nova Publicação'}</DialogTitle>
                                        <DialogDescription>
                                            Partilhe novidades, histórias ou conhecimentos com a sua comunidade.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <ArticleForm 
                                        confrariaId={confrariaData.id}
                                        authorId={user.id}
                                        article={selectedArticle}
                                        onSuccess={handleArticleFormSuccess}
                                    />
                                </DialogContent>
                            </Dialog>
                        }>
                        {articles.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Data de Criação</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {articles.map((article) => (
                                        <TableRow key={article.id}>
                                            <TableCell className="font-medium">{article.title}</TableCell>
                                            <TableCell>{new Date(article.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                                    {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditArticleClick(article)}><Edit className="h-4 w-4"/></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" disabled={isDeletingArticle === article.id}>
                                                             {isDeletingArticle === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Apagar Publicação?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Tem a certeza que quer apagar a publicação &quot;{article.title}&quot;? Esta ação não pode ser desfeita.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteArticle(article)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="font-semibold text-lg">Nenhuma publicação encontrada.</p>
                                <p>Partilhe a sua primeira história com a comunidade.</p>
                            </div>
                        )}
                    </TabContentCard>
                </TabsContent>

                <TabsContent value="gallery" className="mt-6">
                    <TabContentCard 
                        title="Gestão da Galeria" 
                        description="Adicione ou remova imagens da galeria pública da sua confraria." 
                        icon={Camera}
                    >
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <h3 className="font-headline text-xl mb-4">Imagens Atuais</h3>
                                {galleryImages.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {galleryImages.map(image => (
                                            <Card key={image.id} className="group relative">
                                                <Image src={image.image_url} alt={image.description || 'Imagem da galeria'} width={300} height={300} className="rounded-md object-cover aspect-square" />
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon"><Trash2 /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Apagar Imagem?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível. A imagem será removida permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteGalleryImage(image.id)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                                        <p className="font-semibold text-lg">Galeria Vazia.</p>
                                        <p>Adicione imagens para começar.</p>
                                    </div>
                                )}
                             </div>
                            <GalleryImageForm confrariaId={confrariaData.id} />
                         </div>
                    </TabContentCard>
                </TabsContent>

                <TabsContent value="recipes" className="mt-6">
                     <TabContentCard 
                        title="Gestão de Receitas" 
                        description="Partilhe as receitas tradicionais e os segredos culinários da sua confraria." 
                        icon={UtensilsCrossed}
                        actions={
                             <Dialog open={isRecipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleAddNewRecipeClick}><PlusCircle/> Nova Receita</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="font-headline text-2xl">{selectedRecipe ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
                                         <DialogDescription>
                                            Partilhe uma receita que represente o sabor da sua confraria.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <RecipeForm 
                                        confrariaId={confrariaData.id}
                                        authorId={user.id}
                                        recipe={selectedRecipe}
                                        onSuccess={handleRecipeFormSuccess}
                                    />
                                </DialogContent>
                            </Dialog>
                        }
                    >
                        {recipes.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Data de Criação</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {recipes.map((recipe) => (
                                        <TableRow key={recipe.id}>
                                            <TableCell className="font-medium">{recipe.title}</TableCell>
                                            <TableCell>{new Date(recipe.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell><Badge variant={recipe.status === 'published' ? 'default' : 'secondary'}>{recipe.status === 'published' ? 'Publicada' : 'Rascunho'}</Badge></TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditRecipeClick(recipe)}><Edit className="h-4 w-4"/></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" disabled={isDeletingRecipe === recipe.id}>
                                                            {isDeletingRecipe === recipe.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Apagar Receita?</AlertDialogTitle><AlertDialogDescription>Tem a certeza que quer apagar a receita &quot;{recipe.title}&quot;? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteRecipe(recipe)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="font-semibold text-lg">Nenhuma receita publicada.</p>
                                <p>Adicione a sua primeira receita para começar o livro de segredos da confraria.</p>
                            </div>
                        )}
                    </TabContentCard>
                </TabsContent>


            </Tabs>
        </div>
    );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
      Adicionar Imagens
    </Button>
  );
}


function GalleryImageForm({ confrariaId }: { confrariaId: number }) {
    const { toast } = useToast();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();

    const clientAction = async (formData: FormData) => {
        startTransition(async () => {
            const result = await addGalleryImage(formData);

            if (result?.error) {
                toast({
                    title: "Erro ao adicionar imagem",
                    description: result.error,
                    variant: "destructive",
                });
            } else if (result?.success) {
                toast({
                    title: "Sucesso!",
                    description: "Imagem(ns) adicionada(s) à galeria.",
                });
                formRef.current?.reset();
                router.refresh();
            }
        });
    };

    return (
        <form ref={formRef} action={clientAction}>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Adicionar Imagens</CardTitle>
                    <CardDescription>Carregue uma ou mais imagens para a galeria.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <input type="hidden" name="confrariaId" value={confrariaId} />
                    <div className="space-y-2">
                        <Label htmlFor="images">Ficheiros de Imagem</Label>
                        <Input id="images" name="images" type="file" multiple required />
                         <p className="text-xs text-muted-foreground">Pode selecionar múltiplos ficheiros. Limite: 4MB por imagem.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Descrição (Opcional)</Label>
                        <Textarea id="description" name="description" placeholder="Descrição para estas imagens..." />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    );
}

const TabContentCard = ({ title, description, children, icon: Icon, badgeText, actions }: { title: string, description: string, children: React.ReactNode, icon: React.ElementType, badgeText?: string, actions?: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                 <div className={cn("hidden sm:flex p-2 bg-primary/10 rounded-lg mt-1", 
                    title.includes("Pedidos") && "bg-yellow-400/10 text-yellow-600",
                    title.includes("Eventos") && "bg-purple-400/10 text-purple-600",
                    title.includes("Publicações") && "bg-green-400/10 text-green-600",
                    title.includes("Detalhes") && "bg-orange-400/10 text-orange-600",
                    title.includes("Imagens") && "bg-blue-400/10 text-blue-600",
                    title.includes("Galeria") && "bg-indigo-400/10 text-indigo-600",
                    title.includes("Receitas") && "bg-pink-400/10 text-pink-600"
                )}>
                    <Icon className={cn("h-7 w-7 text-primary",
                        title.includes("Pedidos") && "text-yellow-600",
                        title.includes("Eventos") && "text-purple-600",
                        title.includes("Publicações") && "text-green-600",
                        title.includes("Detalhes") && "text-orange-600",
                        title.includes("Imagens") && "text-blue-600",
                        title.includes("Galeria") && "text-indigo-600",
                        title.includes("Receitas") && "text-pink-600"
                    )}/>
                </div>
                <div>
                    <div className="flex items-center gap-4">
                        <CardTitle className="font-headline text-3xl">{title}</CardTitle>
                        {badgeText && <Badge variant="destructive">{badgeText}</Badge>}
                    </div>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-4 pt-2 w-full md:w-auto">
                {actions}
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const ImageUploader = ({ confraria }: { confraria: ConfrariaDataType }) => {
    const router = useRouter();
    const onUploadSuccess = () => {
        router.refresh();
    };
    
    return (
        <div className="grid md:grid-cols-2 gap-8">
            <SealUploader confraria={confraria} onUploadSuccess={onUploadSuccess} />
            <CoverUploader confraria={confraria} onUploadSuccess={onUploadSuccess} />
        </div>
    );
};

const SealUploader = ({ confraria, onUploadSuccess }: { confraria: ConfrariaDataType, onUploadSuccess: () => void }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    
    const handleSuccess = () => {
        setModalOpen(false);
        onUploadSuccess();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Selo da Confraria</CardTitle>
                <CardDescription>A imagem redonda que representa a sua confraria. A imagem será cortada para um formato 1:1.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <Image src={confraria.seal_url} alt="Selo atual" width={120} height={120} className="rounded-full bg-muted p-1" />
                 <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild><Button><Camera className="mr-2" />Alterar Selo</Button></DialogTrigger>
                    <Suspense fallback={<p>A carregar...</p>}>
                        <ImageCropModal 
                            open={isModalOpen}
                            onOpenChange={setModalOpen}
                            confrariaId={confraria.id} 
                            onUploadSuccess={handleSuccess} 
                            imageType="seal_url" 
                            aspect={1}
                            cropShape="round"
                            title="Atualizar Selo"
                        />
                    </Suspense>
                </Dialog>
            </CardContent>
        </Card>
    );
}

const CoverUploader = ({ confraria, onUploadSuccess }: { confraria: ConfrariaDataType, onUploadSuccess: () => void }) => {
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSuccess = () => {
        setModalOpen(false);
        onUploadSuccess();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Imagem de Capa</CardTitle>
                <CardDescription>A imagem de banner que aparece no topo do perfil público. Use uma proporção de 16:9.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="aspect-video w-full relative rounded-md overflow-hidden bg-muted">
                    <Image src={confraria.cover_url} alt="Capa atual" fill sizes="50vw" className="object-cover" />
                </div>
                <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild><Button><Camera className="mr-2" />Alterar Capa</Button></DialogTrigger>
                     <Suspense fallback={<p>A carregar...</p>}>
                        <ImageCropModal 
                            open={isModalOpen}
                            onOpenChange={setModalOpen}
                            confrariaId={confraria.id} 
                            onUploadSuccess={handleSuccess} 
                            imageType="cover_url" 
                            aspect={16 / 9}
                            cropShape="rect"
                            title="Atualizar Imagem de Capa"
                        />
                    </Suspense>
                </Dialog>
            </CardContent>
        </Card>
    );
}
