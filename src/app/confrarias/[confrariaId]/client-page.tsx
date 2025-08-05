
'use client';

import type { Confraria, Discovery, Event, Article, Recipe, ConfrariaGalleryImage } from '@/lib/data';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Calendar, Check, Clock, Feather, MapPin, Users, UserPlus, Wrench, EyeOff, Newspaper, History, UtensilsCrossed, Camera, Shield, NotebookText, Star, Edit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DiscoveryCard } from '@/components/discovery-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';
import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateConfrariaImage } from './manage/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/crop-image';
import { Slider } from '@/components/ui/slider';


type ConfrariaDetails = Confraria & {
  discoveries: Discovery[];
  events: Event[];
  articles: Article[];
  recipes: Recipe[];
  galleryImages: ConfrariaGalleryImage[];
  is_responsible: boolean;
  history: string;
  founders: string;
};

interface ClientConfrariaPageProps {
    confraria: ConfrariaDetails;
    user: User | null;
}

function HistoryCard({ history, confrariaName }: { history: string; confrariaName: string }) {
    const [open, setOpen] = useState(false);
    const MAX_LENGTH = 300; // Character limit before showing "Ver Mais"
    const isLongText = history.length > MAX_LENGTH;

    const visibleText = isLongText ? history.substring(0, MAX_LENGTH) : history;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                    <History className="h-6 w-6 text-primary/80"/>
                    A Nossa História
                </CardTitle>
            </CardHeader>
            <CardContent className="font-body text-foreground/90 whitespace-pre-wrap space-y-4">
                <p>
                    {visibleText}{isLongText && '...'}
                </p>
                {isLongText && (
                    <Dialog open={open} onOpenChange={setOpen}>
                         <style>
                            {`
                                @keyframes unfurl {
                                    from {
                                        max-height: 50vh;
                                        opacity: 0.5;
                                    }
                                    to {
                                        max-height: 90vh;
                                        opacity: 1;
                                    }
                                }
                                .unfurl-animation {
                                    animation: unfurl 0.5s ease-out forwards;
                                }
                                .parchment-scroll::-webkit-scrollbar {
                                    width: 8px;
                                }

                                .parchment-scroll::-webkit-scrollbar-track {
                                    background: transparent;
                                }

                                .parchment-scroll::-webkit-scrollbar-thumb {
                                    background-color: hsl(var(--primary) / 0.5);
                                    border-radius: 10px;
                                    border: 2px solid transparent;
                                    background-clip: content-box;
                                }

                                .parchment-scroll::-webkit-scrollbar-thumb:hover {
                                     background-color: hsl(var(--primary) / 0.7);
                                }
                            `}
                        </style>
                        <DialogTrigger asChild>
                            <Button variant="secondary">Ver Mais</Button>
                        </DialogTrigger>
                        <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-2xl">
                             <DialogTitle className="sr-only">História da {confrariaName}</DialogTitle>
                             <DialogDescription className="sr-only">A história completa da confraria {confrariaName}.</DialogDescription>
                            <div className="relative w-full h-auto">
                                <Image
                                    src="/images/pergaminho.png"
                                    alt="Pergaminho com a história da confraria"
                                    width={800}
                                    height={1067}
                                    className="object-contain"
                                />
                                <div className="absolute inset-0">
                                    <div className="parchment-scroll w-full h-full overflow-y-auto px-24 py-32 pr-24 text-center">
                                         <h2 className="font-parchment text-4xl font-bold text-primary mb-6 mt-12">{confrariaName}</h2>
                                        <p className="font-body text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                            {history}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    )
}

function SealUploadModal({ confrariaId, onUploadSuccess, children }: { confrariaId: number, onUploadSuccess: () => void, children: React.ReactNode }) {
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setLoading(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedImageBlob) {
                 toast({ title: 'Erro', description: 'Não foi possível cortar a imagem.', variant: 'destructive' });
                 setLoading(false);
                 return;
            }
            
            const formData = new FormData();
            formData.append('confraria_id', String(confrariaId));
            formData.append('type', 'seal_url');
            formData.append('image', new File([croppedImageBlob], 'selo.webp', { type: 'image/webp' }));

            const result = await updateConfrariaImage(formData);

            if (result.error) {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Sucesso!', description: result.message });
                onUploadSuccess();
                closeModal();
            }
        } catch (e) {
            console.error(e);
            toast({ title: 'Erro', description: 'Ocorreu um erro inesperado.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal(); else setIsOpen(true); }}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className={imageSrc ? 'sm:max-w-[450px]' : 'sm:max-w-[425px]'}>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Atualizar Selo</DialogTitle>
                    <DialogDescription>{imageSrc ? 'Ajuste a imagem para caber no círculo.' : 'Selecione uma nova imagem para o selo da confraria.'}</DialogDescription>
                </DialogHeader>
                {imageSrc ? (
                    <div className="space-y-4">
                        <div className="relative h-64 w-full bg-muted rounded-md">
                             <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>
                        <div className="space-y-2">
                             <label htmlFor="zoom-slider">Zoom</label>
                             <Slider
                                id="zoom-slider"
                                min={1}
                                max={3}
                                step={0.1}
                                value={[zoom]}
                                onValueChange={(val) => setZoom(val[0])}
                             />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setImageSrc(null)} disabled={loading}>Cancelar</Button>
                            <Button onClick={handleSaveCrop} disabled={loading}>
                                {loading && <Loader2 className="animate-spin mr-2"/>}
                                Guardar Selo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <Button onClick={() => inputRef.current?.click()} className="w-full">
                           <Camera className="mr-2"/> Selecionar Imagem
                        </Button>
                        <input
                            type="file"
                            ref={inputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CoverUploadModal({ confrariaId, onUploadSuccess, children }: { confrariaId: number, onUploadSuccess: () => void, children: React.ReactNode }) {
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await updateConfrariaImage(formData);

        if (result.error) {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso!', description: result.message });
            onUploadSuccess();
            setIsOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Alterar Imagem de Capa</DialogTitle>
                    <DialogDescription>Selecione uma nova imagem de capa. A imagem antiga será substituída.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="confraria_id" value={confrariaId} />
                    <input type="hidden" name="type" value="cover_url" />
                    <div className="space-y-2">
                        <label htmlFor="cover-upload">Novo Ficheiro</label>
                        <Input id="cover-upload" name="image" type="file" required accept="image/png, image/jpeg, image/webp" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="animate-spin mr-2" />}
                        Guardar Capa
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}


export function ClientConfrariaPage({ confraria, user }: ClientConfrariaPageProps) {
    const router = useRouter();

    const onUploadSuccess = () => {
        router.refresh();
    }
    
    return (
        <div>
             <div className="mb-8 container mx-auto px-4 pt-8">
                <Button variant="ghost" asChild>
                    <Link href="/confrarias">
                        <ArrowLeft />
                        Voltar às confrarias
                    </Link>
                </Button>
            </div>
             <div className="relative h-48 md:h-64 w-full group">
                <Image 
                    src={confraria.cover_url ?? 'https://placehold.co/1200x300.png'}
                    alt={`Banner da ${confraria.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint="abstract texture"
                    priority
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
                 {confraria.is_responsible && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <CoverUploadModal
                            confrariaId={confraria.id}
                            onUploadSuccess={onUploadSuccess}
                        >
                            <Button>
                                <Camera className="mr-2 h-4 w-4"/> Alterar Capa
                            </Button>
                        </CoverUploadModal>
                    </div>
                 )}
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12 relative -mt-16 md:-mt-24">
                <section className="bg-card border rounded-lg p-6 md:p-8 mb-12 shadow-lg">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <div className="relative group shrink-0">
                            <Image
                                src={confraria.sealUrl}
                                alt={`Selo da ${confraria.name}`}
                                width={150}
                                height={150}
                                className="rounded-full bg-muted p-2 shadow-lg border-4 border-background"
                                data-ai-hint={confraria.sealHint}
                            />
                            {confraria.is_responsible && (
                                <SealUploadModal
                                    confrariaId={confraria.id}
                                    onUploadSuccess={onUploadSuccess}
                                >
                                    <div className="absolute bottom-2 right-2">
                                        <Button size="icon" variant="secondary" className="rounded-full h-10 w-10">
                                            <Camera className="h-5 w-5"/>
                                        </Button>
                                    </div>
                                </SealUploadModal>
                            )}
                        </div>
                        <div className="text-center md:text-left flex-grow">
                            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
                                {confraria.name}
                            </h1>
                            <p className="text-xl md:text-2xl italic text-muted-foreground mb-4">
                                &quot;{confraria.motto}&quot;
                            </p>
                            <div className="flex justify-center md:justify-start flex-wrap gap-2">
                                <Badge variant="secondary" className="text-sm flex items-center gap-2 px-3 py-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{confraria.region}</span>
                                </Badge>
                                <Badge variant="secondary" className="text-sm flex items-center gap-2 px-3 py-1">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{confraria.discoveries.length} {confraria.discoveries.length === 1 ? 'descoberta' : 'descobertas'}</span>
                                </Badge>
                            </div>
                        </div>
                        <div className="shrink-0 mt-4 md:mt-0">
                           {confraria.is_responsible && (
                                <Button asChild>
                                    <Link href={`/confrarias/${confraria.id}/manage`}>
                                        <Wrench /> Gerir Confraria
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>
                
                <Tabs defaultValue="inicio" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="inicio"><Newspaper className="mr-2 h-4 w-4"/>Início</TabsTrigger>
                        <TabsTrigger value="gallery"><Camera className="mr-2 h-4 w-4"/>Galeria</TabsTrigger>
                        <TabsTrigger value="recipes"><UtensilsCrossed className="mr-2 h-4 w-4"/>Receitas</TabsTrigger>
                        <TabsTrigger value="discoveries"><Star className="mr-2 h-4 w-4"/>Descobertas</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6">
                        <TabsContent value="inicio">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2 space-y-12">
                                    <section>
                                        <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                            <Newspaper className="h-8 w-8 text-primary/80"/>
                                            Publicações
                                        </h2>
                                        {confraria.articles && confraria.articles.length > 0 ? (
                                            <div className="space-y-6">
                                                {confraria.articles.map(article => (
                                                    <Card key={article.id} className="border-l-4 border-primary">
                                                        <CardHeader>
                                                            <CardTitle className="font-headline text-2xl">{article.title}</CardTitle>
                                                            <CardDescription className="flex items-center gap-2 pt-2 text-sm">
                                                                <Calendar className="h-4 w-4"/> Publicado a {new Date(article.published_at!).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-base text-muted-foreground line-clamp-3">{article.content}</p>
                                                            <Button variant="link" asChild className="p-0 h-auto mt-2">
                                                                <Link href="#">Ler Mais</Link>
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <Card className="border-l-4 border-primary">
                                                <CardContent className="p-6 text-center text-muted-foreground">
                                                    Esta confraria ainda não tem publicações.
                                                </CardContent>
                                            </Card>
                                        )}
                                    </section>
                                     <section>
                                        <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                            <Calendar className="h-8 w-8 text-primary/80"/>
                                            Próximos Eventos
                                        </h2>
                                        {confraria.events && confraria.events.length > 0 ? (
                                            <div className="space-y-4">
                                                {confraria.events.map(event => (
                                                    <Card key={event.id} className="border-l-4 border-primary/50 flex flex-col sm:flex-row">
                                                        <div className="flex-shrink-0 w-full sm:w-40 h-40 sm:h-auto relative">
                                                            <Image src={event.image_url ?? 'https://placehold.co/400x400.png'} alt={event.name} fill className="object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none" data-ai-hint={event.image_hint ?? 'event'} />
                                                        </div>
                                                        <CardHeader className="flex-grow">
                                                            <CardTitle className="font-headline text-2xl flex items-center justify-between">
                                                                {event.name}
                                                                {!event.is_public && (
                                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                                        <EyeOff className="h-3 w-3" /> Privado
                                                                    </Badge>
                                                                )}
                                                            </CardTitle>
                                                            <CardDescription className="flex items-center gap-2 pt-2 text-base"><Calendar className="h-4 w-4"/> {new Date(event.event_date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</CardDescription>
                                                            <CardContent className="p-0 pt-2">
                                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                                                                <p className="font-semibold flex items-center gap-2 pt-2"><MapPin className="h-4 w-4 text-primary"/>{event.location || 'Local a confirmar'}</p>
                                                            </CardContent>
                                                        </CardHeader>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <Card className="border-l-4 border-primary">
                                                <CardContent className="p-6 text-center text-muted-foreground">
                                                    De momento, não existem eventos agendados.
                                                </CardContent>
                                            </Card>
                                        )}
                                    </section>
                                </div>
                                 <aside className="space-y-8">
                                    <HistoryCard history={confraria.history} confrariaName={confraria.name} />
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="font-headline text-2xl flex items-center gap-3">
                                                <Users className="h-6 w-6 text-primary/80"/>
                                                Fundadores
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="font-body text-foreground/90 whitespace-pre-wrap">
                                            {confraria.founders}
                                        </CardContent>
                                    </Card>
                                </aside>
                            </div>
                        </TabsContent>

                        <TabsContent value="gallery">
                             <section>
                                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                    <Camera className="h-8 w-8 text-primary/80"/>
                                    Galeria
                                </h2>
                                {confraria.galleryImages && confraria.galleryImages.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {confraria.galleryImages.map(image => (
                                            <Dialog key={image.id}>
                                                <DialogTrigger asChild>
                                                    <Card className="overflow-hidden cursor-pointer group">
                                                        <div className="aspect-square relative">
                                                            <Image src={image.image_url} alt={image.description || 'Imagem da galeria'} fill className="object-cover transition-transform duration-300 group-hover:scale-110"/>
                                                        </div>
                                                    </Card>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogTitle className="sr-only">Imagem da galeria ampliada</DialogTitle>
                                                    <DialogDescription className="sr-only">
                                                        {image.description || `Imagem da galeria da ${confraria.name}`}
                                                    </DialogDescription>
                                                    <Image src={image.image_url} alt={image.description || 'Imagem da galeria'} width={1200} height={800} className="rounded-md object-contain"/>
                                                    {image.description && <p className="text-center mt-2">{image.description}</p>}
                                                </DialogContent>
                                            </Dialog>
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="p-6 text-center text-muted-foreground">
                                            Esta confraria ainda não partilhou nenhum momento na sua galeria.
                                        </CardContent>
                                    </Card>
                                )}
                            </section>
                        </TabsContent>

                        <TabsContent value="recipes">
                             <section>
                                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                    <UtensilsCrossed className="h-8 w-8 text-primary/80"/>
                                    Receitas
                                </h2>
                                {confraria.recipes && confraria.recipes.length > 0 ? (
                                    <div className="space-y-6">
                                        {confraria.recipes.map(recipe => (
                                            <Card key={recipe.id} className="border-l-4 border-primary">
                                                <CardHeader>
                                                    <CardTitle className="font-headline text-2xl">{recipe.title}</CardTitle>
                                                    {recipe.description && <CardDescription>{recipe.description}</CardDescription>}
                                                </CardHeader>
                                                <CardContent>
                                                    <Button variant="link" asChild className="p-0 h-auto">
                                                        <Link href="#">Ver Receita Completa</Link>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="p-6 text-center text-muted-foreground">
                                            O livro de receitas desta confraria ainda é um segredo.
                                        </CardContent>
                                    </Card>
                                )}
                            </section>
                        </TabsContent>
                        
                        <TabsContent value="discoveries">
                            <section>
                                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                    <Star className="h-8 w-8 text-primary/80"/>
                                    Descobertas Recomendadas
                                </h2>
                                {confraria.discoveries && confraria.discoveries.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {confraria.discoveries.map((discovery) => (
                                        <DiscoveryCard key={discovery.id} discovery={discovery} />
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="p-6 text-center text-muted-foreground">
                                            <p className="font-semibold text-lg">Nenhuma descoberta por aqui... ainda.</p>
                                            <p>Esta confraria ainda não partilhou os seus segredos.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </section>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
