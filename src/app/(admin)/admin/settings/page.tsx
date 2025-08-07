
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { SettingsForm } from './settings-form';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getSettings(): Promise<{ mapbox_api_key: string }> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('settings').select('key, value');
    
    if (error) {
        console.error("Error fetching settings:", error);
        return { mapbox_api_key: '' };
    }
    
    const settings = data.reduce((acc, { key, value }) => {
        if(key) acc[key] = value;
        return acc;
    }, {} as any);

    return {
        mapbox_api_key: settings.mapbox_api_key || '',
    };
}


export default async function AdminSettingsPage() {
  await checkAdmin();
  const settings = await getSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary"/>
            Definições da Aplicação
        </CardTitle>
        <CardDescription>
          Gira as configurações e chaves de API para os serviços integrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsForm settings={settings} />
      </CardContent>
    </Card>
  );
}
