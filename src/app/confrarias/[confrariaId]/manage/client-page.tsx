

'use client';

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect, useRouter } from 'next/navigation';
import { ManageConfrariaForm } from './edit-form';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Users, X, Calendar, PenSquare, LayoutDashboard, PlusCircle, Edit, MapPin, Trash2, Loader2, ArrowLeft, Newspaper, Camera, UtensilsCrossed } from 'lucide-react';
import { removeMember, addGalleryImage, deleteGalleryImage } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getUserRank, type UserRankInfo, regions, rankIcons } from '@/lib/data';
import { EventForm } from './event-form';
import { ArticleForm } from './article-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Event, Article, Recipe, ConfrariaGalleryImage } from '@/lib/data';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useRef } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RecipeForm } from './recipe-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';


type Member = {
    id: number; // This is the membership ID
    user_id: string;
    user_email: string;
    user_full_name: string | null;
    rank: UserRankInfo;
}

type ConfrariaDataType = {
    id: number;
    name: string;
    motto: string;
    history: string;
    founders: string;
    region: (typeof regions)[number];
}

export type ManageConfrariaPageProps = {
    confrariaData: ConfrariaDataType;
    approvedMembers: Member[];
    events: Event[];
    articles: Article[];
    recipes: Recipe[];
    galleryImages: ConfrariaGalleryImage[];
    user: User;
}

// Client component to handle state and interactions
export function ClientManagePage({ confrariaData, approvedMembers, events, articles, recipes, galleryImages, user }: ManageConfrariaPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isEventDialogOpen, setEventDialogOpen] = useState(false);
    const [isArticleDialogOpen, setArticleDialogOpen] = useState(false);
    const [isRecipeDialogOpen, setRecipeDialogOpen] = useState(false);
    const [isGalleryDialogOpen, setGalleryDialogOpen] = useState(false);
    
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const [isRemovingMember, setIsRemovingMember] = useState<number | null>(null);
    
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

    const handleGalleryFormSuccess = () => {
        setGalleryDialogOpen(false);
        router.refresh();
    };
    
    const handleRemoveMember = async (membershipId: number, memberName: string) => {
        setIsRemovingMember(membershipId);
        const formData = new FormData();
        formData.append('membershipId', String(membershipId));
        formData.append('confrariaId', String(confrariaData.id));

        const result = await removeMember(formData);

        if (result.error) {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso', description: `O confrade ${memberName} foi removido.` });
            router.refresh();
        }
        setIsRemovingMember(null);
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
            
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4"/>Visão Geral</TabsTrigger>
                    <TabsTrigger value="details"><PenSquare className="mr-2 h-4 w-4"/>Editar Detalhes</TabsTrigger>
                    <TabsTrigger value="members">
                        <Users className="mr-2 h-4 w-4"/>
                        Membros
                            {approvedMembers.length > 0 && <Badge className="ml-2">{approvedMembers.length}</Badge>}
                    </TabsTrigger>
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

                <TabsContent value="overview" className="mt-6">
                    <TabContentCard title="Visão Geral" description="Resumo rápido do estado da sua confraria." icon={LayoutDashboard}>
                    <p>Bem-vindo ao painel de gestão. Use as abas acima para navegar entre as diferentes secções.</p>
                        <p className="mt-4 text-sm text-muted-foreground">Futuramente, esta área terá estatísticas e atalhos úteis.</p>
                    </TabContentCard>
                </TabsContent>
                
                <TabsContent value="details" className="mt-6">
                    <TabContentCard title="Editar Detalhes" description="Atualize as informações públicas da sua confraria que todos podem ver." icon={PenSquare}>
                        <ManageConfrariaForm confraria={confrariaData} />
                    </TabContentCard>
                </TabsContent>

                <TabsContent value="members" className="mt-6">
                    <TabContentCard 
                        title="Gestão de Membros" 
                        description="Veja todos os membros, altere cargos ou remova membros." 
                        icon={Users}
                        badgeText={approvedMembers.length > 0 ? `${approvedMembers.length} membro(s)` : undefined}
                    >
                        {approvedMembers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Confrade</TableHead>
                                        <TableHead>Nível</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvedMembers.map((member) => {
                                            const RankIcon = rankIcons[member.rank.rankIconName];
                                            return (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">
                                                <div className="font-bold">{member.user_full_name || 'Nome não definido'}</div>
                                                <div className="text-xs text-muted-foreground">{member.user_email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                                                    <RankIcon className="h-4 w-4 text-primary" />
                                                    <span>{member.rank.rankName}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon" disabled={isRemovingMember === member.id}>
                                                            {isRemovingMember === member.id ? <Loader2 className="animate-spin"/> : <Trash2 />}
                                                            </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Expulsar Confrade?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tem a certeza que deseja remover <strong>{member.user_full_name || member.user_email}</strong> da confraria? Esta ação é irreversível.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemoveMember(member.id, member.user_full_name || member.user_email)} className="bg-destructive hover:bg-destructive/90">
                                                            Sim, Remover
                                                        </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="font-semibold text-lg">Ainda não há membros.</p>
                                <p>Aprove os pedidos de adesão para começar a formar a sua irmandade.</p>
                            </div>
                        )}
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
                                    </DialogHeader>
                                    <EventForm 
                                        confrariaId={confrariaData.id} 
                                        confrariaRegion={confrariaData.region} 
                                        event={selectedEvent} 
                                        onSuccess={handleEventFormSuccess}
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
                                        <Button variant="outline" size="icon" onClick={() => handleEditEventClick(event)}><Edit className="h-4 w-4"/></Button>
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
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="icon" onClick={() => handleEditArticleClick(article)}><Edit className="h-4 w-4"/></Button>
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
                        actions={
                            <Dialog open={isGalleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
                                <DialogTrigger asChild><Button><PlusCircle/> Adicionar Imagem</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="font-headline text-2xl">Adicionar à Galeria</DialogTitle>
                                        <DialogDescription>Carregue uma nova imagem para partilhar com a comunidade.</DialogDescription>
                                    </DialogHeader>
                                    <GalleryImageForm confrariaId={confrariaData.id} onSuccess={handleGalleryFormSuccess} />
                                </DialogContent>
                            </Dialog>
                        }
                    >
                        {galleryImages.length > 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                             <div className="text-center py-12 text-muted-foreground">
                                <p className="font-semibold text-lg">Galeria Vazia.</p>
                                <p>Comece a adicionar imagens para criar a memória visual da sua confraria.</p>
                            </div>
                        )}
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
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="icon" onClick={() => handleEditRecipeClick(recipe)}><Edit className="h-4 w-4"/></Button>
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

const TabContentCard = ({ title, description, children, icon: Icon, badgeText, actions }: { title: string, description: string, children: React.ReactNode, icon: React.ElementType, badgeText?: string, actions?: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-start justify-between">
            <div>
                 <CardTitle className="font-headline text-3xl flex items-center gap-3">
                    <div className={cn("p-2 bg-primary/10 rounded-lg", 
                        title.includes("Pedidos") && "bg-yellow-400/10 text-yellow-600",
                        title.includes("Membros") && "bg-blue-400/10 text-blue-600",
                        title.includes("Eventos") && "bg-purple-400/10 text-purple-600",
                        title.includes("Publicações") && "bg-green-400/10 text-green-600",
                        title.includes("Detalhes") && "bg-orange-400/10 text-orange-600",
                        title.includes("Galeria") && "bg-indigo-400/10 text-indigo-600",
                        title.includes("Receitas") && "bg-pink-400/10 text-pink-600"
                    )}>
                        <Icon className={cn("h-7 w-7 text-primary",
                           title.includes("Pedidos") && "text-yellow-600",
                           title.includes("Membros") && "text-blue-600",
                           title.includes("Eventos") && "text-purple-600",
                           title.includes("Publicações") && "text-green-600",
                           title.includes("Detalhes") && "text-orange-600",
                           title.includes("Galeria") && "text-indigo-600",
                           title.includes("Receitas") && "text-pink-600"
                        )}/>
                    </div>
                    <div>
                        <div className="flex items-center gap-4">
                           <span className="font-headline text-3xl">{title}</span>
                           {badgeText && <Badge variant="destructive">{badgeText}</Badge>}
                        </div>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </CardTitle>
            </div>
            <div className="flex items-center gap-4 pt-2">
                {actions}
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const GalleryImageForm = ({ confrariaId, onSuccess }: { confrariaId: number, onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await addGalleryImage(formData);
        if(result.error) {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso', description: result.message });
            formRef.current?.reset();
            onSuccess();
        }
        setLoading(false);
    }
    
    return (
         <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="confraria_id" value={confrariaId} />
            <div className="space-y-2">
                <label htmlFor="gallery-image">Ficheiro da Imagem</label>
                <Input id="gallery-image" name="image" type="file" required accept="image/png, image/jpeg, image/webp" />
            </div>
             <div className="space-y-2">
                <label htmlFor="gallery-description">Descrição (Opcional)</label>
                <Textarea id="gallery-description" name="description" placeholder="Descreva a imagem ou o momento..."/>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                Adicionar
            </Button>
        </form>
    )
}
