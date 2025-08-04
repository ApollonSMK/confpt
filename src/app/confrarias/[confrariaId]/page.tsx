

'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { Confraria, Discovery, Event, Article, Recipe, ConfrariaGalleryImage } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { ClientConfrariaPage } from './client-page';


async function getConfrariaDetails(confrariaId: number, user: User | null) {
    const supabase = createServiceRoleClient();

    const { data: confrariaData, error } = await supabase
        .from('confrarias')
        .select(`
            *,
            discoveries (
                *,
                discovery_types (name),
                discovery_images (image_url, image_hint),
                discovery_seal_counts (seal_count),
                confrarias (id, name, seal_url, seal_hint)
            ),
            events (*),
            articles (*),
            recipes (*),
            confraria_gallery_images (*),
            confraria_members_count (member_count)
        `)
        .eq('id', confrariaId)
        .single();
    
    if (error || !confrariaData) {
        console.error(`Error fetching confraria with id ${confrariaId}:`, error);
        notFound();
    }
    
    const discoveries = (confrariaData.discoveries || []).map((d: any) => {
        const images = (d.discovery_images || []).map((img: any) => ({
            imageUrl: img.image_url,
            imageHint: img.image_hint,
        }));
        return {
            ...d,
            type: d.discovery_types.name,
            confrariaId: d.confraria_id,
            images: images,
            imageUrl: images[0]?.imageUrl || 'https://placehold.co/600x400.png',
            imageHint: images[0]?.imageHint || 'placeholder',
            confrarias: d.confrarias ? { ...d.confrarias, sealUrl: d.confrarias.seal_url, sealHint: d.confrarias.seal_hint } : undefined,
            seal_count: d.discovery_seal_counts[0]?.seal_count || 0,
        }
    }) as Discovery[];
    
    const articles = (confrariaData.articles || [])
        .filter((a: Article) => a.status === 'published')
        .sort((a: Article, b: Article) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime());

    const recipes = (confrariaData.recipes || [])
        .filter((r: Recipe) => r.status === 'published')
        .sort((a: Recipe, b: Recipe) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const galleryImages = (confrariaData.confraria_gallery_images || [])
        .sort((a: ConfrariaGalleryImage, b: ConfrariaGalleryImage) => a.sort_order - b.sort_order);

    const isResponsible = user ? (user.id === confrariaData.responsible_user_id || user.email === process.env.ADMIN_EMAIL) : false;
    
    return {
        ...confrariaData,
        sealUrl: confrariaData.seal_url,
        sealHint: confrariaData.seal_hint,
        discoveries,
        events: (confrariaData.events || []).sort((a: Event, b: Event) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()),
        articles,
        recipes,
        galleryImages,
        member_count: (confrariaData as any).confraria_members_count[0]?.member_count || 0,
        is_responsible: isResponsible,
        history: confrariaData.history || 'A história desta confraria ainda não foi contada.',
        founders: confrariaData.founders || 'Os nobres fundadores desta confraria ainda não foram nomeados.',
    } as any;
}


// The page itself remains a server component for data fetching
export default async function ConfrariaPage({ params }: { params: { confrariaId: string } }) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const confrariaId = parseInt(params.confrariaId, 10);
    if (isNaN(confrariaId)) {
        notFound();
    }

    const confrariaDetails = await getConfrariaDetails(confrariaId, user);
    
    return (
        <ClientConfrariaPage confraria={confrariaDetails} user={user} />
    );
}
