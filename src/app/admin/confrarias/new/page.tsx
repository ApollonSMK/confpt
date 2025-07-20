
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

export default async function NewConfrariaPage() {
    await checkAdmin();

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Adicionar Nova Confraria</CardTitle>
                        <CardDescription>
                            Preencha os detalhes da nova confraria que se junta à nossa nobre causa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">O formulário de criação estará aqui em breve.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
