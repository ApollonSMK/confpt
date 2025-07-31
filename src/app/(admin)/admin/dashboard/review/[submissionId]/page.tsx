

'use server'

import { createServiceRoleClient } from '@/lib/supabase/service';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Submission } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Image as ImageIcon } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import Image from 'next/image';

type ReviewPageProps = {
  params: {
    submissionId: string;
  };
};

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getSubmission(id: string): Promise<(Submission & { confrariaName?: string, typeName?: string }) | null> {
    const supabase = createServiceRoleClient();
    const { data: submission, error } = await supabase
        .from('submissions')
        .select('*, discovery_types(name)')
        .eq('id', id)
        .single();
    
    if (error || !submission) {
        console.error('Error fetching submission:', error);
        notFound();
    }

    // Explicitly fetch user email from auth schema using RPC
    const { data: user, error: userError } = await supabase
        .rpc('get_user_emails_by_ids', { p_user_ids: [submission.user_id] });

    if (userError || !user || user.length === 0) {
        console.error('Error fetching submission user:', userError);
    }

    let confrariaName: string | undefined = undefined;
    if (submission.confraria_id) {
        const { data: confraria } = await supabase
            .from('confrarias')
            .select('name')
            .eq('id', submission.confraria_id)
            .single();
        confrariaName = confraria?.name;
    }

    return {
        ...(submission as any),
        typeName: (submission as any).discovery_types.name,
        discoveryTitle: submission.discovery_title,
        users: { email: user && user.length > 0 ? user[0].email : 'Utilizador Desconhecido' },
        confrariaName,
    } as Submission & { confrariaName?: string, typeName?: string };
}


export async function approveSubmission(formData: FormData) {
    'use server'
    await checkAdmin();
    const submissionId = formData.get('submissionId') as string;
    const submission = await getSubmission(submissionId);

    if (!submission) {
        console.error("Submission not found for approval");
        return;
    }

    const supabase = createServiceRoleClient();

    // 1. Create slug from title
    const slug = submission.discoveryTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // 2. Insert into discoveries table
    const { data: discoveryData, error: insertError } = await supabase
        .from('discoveries')
        .insert({
            title: submission.discoveryTitle,
            description: submission.editorial.substring(0, 100) + '...', // Automatic short description
            editorial: submission.editorial,
            region: submission.region,
            type_id: submission.type,
            confraria_id: submission.confraria_id,
            slug: slug,
            website: submission.links,
        }).select('id').single();

    if (insertError) {
        console.error("Error creating discovery from submission:", insertError);
        // Maybe show an error to the user
        return;
    }
    
    // 3. Insert image into discovery_images
    const imageUrl = submission.image_url ?? 'https://placehold.co/600x400.png';
    const imageHint = submission.image_url ? 'user submission' : 'placeholder';

    const { error: imageError } = await supabase
        .from('discovery_images')
        .insert({
            discovery_id: discoveryData.id,
            image_url: imageUrl,
            image_hint: imageHint,
            sort_order: 0,
        });

    if (imageError) {
        console.error("Error adding image for approved submission:", imageError);
        // We can continue, as the discovery was created, but log the error
    }


    // 4. Update submission status to 'Aprovado'
    const { error: updateError } = await supabase
        .from('submissions')
        .update({ status: 'Aprovado' })
        .eq('id', submissionId);

    if (updateError) {
        console.error("Error updating submission status:", updateError);
        return;
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/discoveries');
    revalidatePath(`/discoveries/${slug}`);
    revalidatePath('/profile'); // Revalidate profile for the user who submitted
    redirect('/admin/dashboard');
}

export async function rejectSubmission(formData: FormData) {
    'use server'
    await checkAdmin();
    const submissionId = formData.get('submissionId') as string;
    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from('submissions')
        .update({ status: 'Rejeitado' })
        .eq('id', submissionId);

    if (error) {
        console.error("Error rejecting submission:", error);
        return;
    }
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/profile');
    redirect('/admin/dashboard');
}


export default async function ReviewSubmissionPage({ params }: ReviewPageProps) {
    await checkAdmin();
    const submission = await getSubmission(params.submissionId);

    if (!submission) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Rever Submissão</CardTitle>
                        <CardDescription>
                            Avalie os detalhes da submissão e decida se deve ser aprovada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {submission.image_url && (
                             <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Imagem Submetida</h3>
                                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                                    <Image src={submission.image_url} alt={`Imagem para ${submission.discoveryTitle}`} fill className="object-cover" />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <h3 className="font-semibold">Título</h3>
                            <p>{submission.discoveryTitle}</p>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold">Submetido por</h3>
                            <p className="text-muted-foreground">{submission.users?.email ?? 'Desconhecido'}</p>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold">Descrição Editorial</h3>
                            <p className="whitespace-pre-wrap font-body text-foreground/90">{submission.editorial}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h3 className="font-semibold">Região</h3>
                                <div><Badge variant="secondary">{submission.region}</Badge></div>
                            </div>
                             <div className="space-y-1">
                                <h3 className="font-semibold">Tipo</h3>
                                <div><Badge variant="secondary">{submission.typeName}</Badge></div>
                            </div>
                        </div>
                         {submission.confrariaName && (
                            <div className="space-y-1">
                                <h3 className="font-semibold">Confraria Sugerida</h3>
                                <p>{submission.confrariaName}</p>
                            </div>
                        )}
                        {submission.links && (
                             <div className="space-y-1">
                                <h3 className="font-semibold">Link Associado</h3>
                                <a href={submission.links} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{submission.links}</a>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                        <form action={rejectSubmission}>
                            <input type="hidden" name="submissionId" value={submission.id} />
                            <Button type="submit" variant="destructive">
                                <X className="mr-2 h-4 w-4" />
                                Rejeitar
                            </Button>
                        </form>
                        <form action={approveSubmission}>
                            <input type="hidden" name="submissionId" value={submission.id} />
                            <Button type="submit">
                                <Check className="mr-2 h-4 w-4" />
                                Aprovar
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

