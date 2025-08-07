
'use server';

import { createServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Submission, Confraria, DiscoveryType, Discovery } from "@/lib/data";
import { UserDiscoveryForm } from "./user-discovery-form";

// This page now handles editing an approved discovery.
// It fetches the full discovery data based on the submission.

async function getDiscoveryFromSubmission(submissionId: number, userId: string): Promise<Discovery> {
    const supabaseService = createServiceRole_client();

    // First, verify the user owns the submission
    const { data: submission, error: submissionError } = await supabaseService
        .from('submissions')
        .select('discovery_title, user_id, status')
        .eq('id', submissionId)
        .single();
    
    if (submissionError || !submission) {
        console.error("Submission not found for editing:", submissionError);
        notFound();
    }

    if (submission.user_id !== userId) {
        console.error(`User ${userId} attempted to edit submission ${submissionId} owned by ${submission.user_id}`);
        notFound();
    }

    if (submission.status !== 'Aprovado') {
        // This page is only for approved discoveries.
        // A separate logic branch could be made for pending submissions if needed.
        redirect('/profile?error=not_approved');
    }

    // Now, find the corresponding discovery. This assumes the title is a unique enough identifier.
    // A better long-term solution would be to store discovery_id on the submission upon approval.
    const { data: discovery, error: discoveryError } = await supabaseService
        .from('discoveries')
        .select(`
            *,
            discovery_types(id, name),
            discovery_images(id, image_url, image_hint)
        `)
        .eq('title', submission.discovery_title)
        .limit(1)
        .single();

    if (discoveryError || !discovery) {
        console.error(`Could not find a discovery for approved submission ${submissionId}`, discoveryError);
        // Maybe the title was changed by an admin.
        notFound();
    }

    const images = (discovery.discovery_images as any[]).map(img => ({
        id: img.id,
        imageUrl: img.image_url,
        imageHint: img.image_hint,
    }));

    return {
        ...discovery,
        type: (discovery.discovery_types as any).name,
        type_id: (discovery.discovery_types as any).id,
        images: images,
        imageUrl: images[0]?.imageUrl || 'https://placehold.co/600x400.png',
        imageHint: images[0]?.imageHint || 'placeholder',
    } as Discovery;
}


async function getConfrarias(): Promise<Confraria[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('confrarias').select('*').order('name');
    if (error) return [];
    return data as Confraria[];
}

async function getDiscoveryTypes(): Promise<DiscoveryType[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('discovery_types').select('*').order('name');
    if (error) return [];
    return data as DiscoveryType[];
}


export default async function UserEditDiscoveryPage({ params }: { params: { submissionId: string } }) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const submissionId = parseInt(params.submissionId, 10);
    if (isNaN(submissionId)) {
        notFound();
    }
    
    // If the submission is approved, we fetch the DISCOVERY data
    const discovery = await getDiscoveryFromSubmission(submissionId, user.id);
    
    const [confrarias, discoveryTypes] = await Promise.all([
        getConfrarias(),
        getDiscoveryTypes(),
    ]);

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                 <UserDiscoveryForm discovery={discovery} confrarias={confrarias} discoveryTypes={discoveryTypes} />
            </div>
        </div>
    );
}

// Helper function because createServiceRoleClient is not available on the client
const createServiceRole_client = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not set in .env.local');
  }

  // We use the normal Supabase client here, but with the service role key.
  // This is safe because this code only runs on the server.
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};
