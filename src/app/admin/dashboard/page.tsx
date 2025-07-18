import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!user || user.email !== adminEmail) {
    redirect('/');
  }

  return user;
}

export default async function AdminDashboardPage() {
  const user = await checkAdmin();

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">Painel Administrativo</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Bem-vindo, Confrade-Mor {user.user_metadata?.full_name || user.email}.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Aprovação de Submissões</CardTitle>
            <CardDescription>
              Aqui você poderá rever e aprovar as descobertas submetidas pela comunidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Em Breve!</AlertTitle>
              <AlertDescription>
                A funcionalidade de gestão de submissões está em desenvolvimento.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
