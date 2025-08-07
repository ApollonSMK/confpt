

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
    
    // Allow editing for 'Pendente' or 'Aprovado'
    if (submission.status === 'Rejeitado') {
        console.warn(`User ${userId} tried to edit a rejected submission ${submissionId}`);
        redirect('/profile');
    }

    return submission as Submission;
}

// Find the corresponding discovery if the submission was approved
async function findDiscoveryBySubmission(submission: Submission) {
    if (submission.status !== 'Aprovado') {
        return null;
    }
    // This is a bit fragile as it relies on the title being unique.
    // A better approach would be to store the discovery_id on the submission upon approval.
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('discoveries')
        .select('id')
        .eq('title', submission.discovery_title)
        .limit(1)
        .single();
    
    if (error || !data) {
        console.error(`Could not find a discovery for approved submission ${submission.id}`, error);
        return null;
    }
    
    return data.id;
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
    
    const submission = await getSubmissionForEdit(submissionId, user.id);

    // If the submission is approved, redirect to the admin discovery edit page
    if (submission.status === 'Aprovado') {
        const discoveryId = await findDiscoveryBySubmission(submission);
        if (discoveryId) {
            // Redirecting to the main discovery edit page.
            // RLS on the `discoveries` table itself is not configured for user edits,
            // so this will rely on the user being an admin or responsible for a confraria.
            // For a full user-edit feature, this would need a different edit page
            // with appropriate security checks.
            redirect(`/admin/discoveries/${discoveryId}/edit`);
        } else {
             // If we can't find the discovery, we can't edit. Show an error or redirect.
            redirect('/profile?error=discovery_not_found');
        }
    }
    
    // If pending, show the submission edit form
    const [confrarias, discoveryTypes] = await Promise.all([
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
