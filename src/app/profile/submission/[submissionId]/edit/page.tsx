
'use server';

import { createServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Submission, Confraria, DiscoveryType } from "@/lib/data";
import { EditSubmissionForm } from "./edit-form";


async function getSubmissionForEdit(submissionId: number, userId: string) {
    const supabase = createServerClient();

    const { data: submission, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('user_id', userId) // RLS check
        .single();
    
    if (error || !submission) {
        console.error("Error fetching submission for edit or not found:", error);
        notFound();
    }
    
    if (submission.status !== 'Pendente') {
        console.warn(`User ${userId} tried to edit a non-pending submission ${submissionId}`);
        redirect('/profile');
    }

    return submission as Submission;
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


export default async function EditSubmissionPage({ params }: { params: { submissionId: string } }) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const submissionId = parseInt(params.submissionId, 10);
    if (isNaN(submissionId)) {
        notFound();
    }
    
    const [submission, confrarias, discoveryTypes] = await Promise.all([
        getSubmissionForEdit(submissionId, user.id),
        getConfrarias(),
        getDiscoveryTypes(),
    ]);

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                 <EditSubmissionForm submission={submission} confrarias={confrarias} discoveryTypes={discoveryTypes} />
            </div>
        </div>
    );
}

