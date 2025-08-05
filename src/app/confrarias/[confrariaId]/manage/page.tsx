

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/service';
import type { Event, Article, Recipe, ConfrariaGalleryImage } from '@/lib/data';
import { ClientManagePage, type ManageConfrariaPageProps } from './client-page';


async function getConfrariaAndRelatedData(id: number, user: User) {
    const supabaseService = createServiceRoleClient();

    const { data: confrariaData, error: confrariaError } = await supabaseService
        .from('confrarias')
        .select('*')
        .eq('id', id)
        .single();

    if (confrariaError || !confrariaData) {
        console.error("Error fetching confraria for management", confrariaError);
        notFound();
    }
    
    const isAdmin = (user.email === process.env.ADMIN_EMAIL);
    if (confrariaData.responsible_user_id !== user.id && !isAdmin) {
        console.warn(`User ${user.id} tried to manage confraria ${id} without permission.`);
        redirect(`/confrarias/${id}`);
    }
    
    const [events, articles, recipes, galleryImages] = await Promise.all([
        supabaseService.from('events').select('*').eq('confraria_id', id).order('event_date', { ascending: true }),
        supabaseService.from('articles').select('*').eq('confraria_id', id).order('created_at', { ascending: false }),
        supabaseService.from('recipes').select('*').eq('confraria_id', id).order('created_at', { ascending: false }),
        supabaseService.from('confraria_gallery_images').select('*').eq('confraria_id', id).order('sort_order', { ascending: true }),
    ]);
    
    if(events.error) console.error("Error fetching events:", events.error);
    if(articles.error) console.error("Error fetching articles:", articles.error);
    if(recipes.error) console.error("Error fetching recipes:", recipes.error);
    if(galleryImages.error) console.error("Error fetching gallery images:", galleryImages.error);


    return { 
        confrariaData: {
            id: confrariaData.id,
            name: confrariaData.name,
            motto: confrariaData.motto,
            history: confrariaData.history ?? '',
            founders: confrariaData.founders ?? '',
            region: confrariaData.region,
            seal_url: confrariaData.seal_url,
            cover_url: confrariaData.cover_url ?? 'https://placehold.co/1200x300.png',
        },
        events: (events.data as Event[] || []),
        articles: (articles.data as Article[] || []),
        recipes: (recipes.data as Recipe[] || []),
        galleryImages: (galleryImages.data as ConfrariaGalleryImage[] || []),
    };
}


// Server component to fetch data
export default async function ManageConfrariaPage({ params }: { params: { confrariaId: string } }) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const confrariaId = parseInt(params.confrariaId, 10);
    if (isNaN(confrariaId)) {
        notFound();
    }
    
    const { confrariaData, events, articles, recipes, galleryImages } = await getConfrariaAndRelatedData(confrariaId, user);
    
    const pageProps: Omit<ManageConfrariaPageProps, 'approvedMembers'> = {
        confrariaData,
        events,
        articles,
        recipes,
        galleryImages,
        user,
    };

    return (
        <ClientManagePage {...pageProps} />
    );
}
