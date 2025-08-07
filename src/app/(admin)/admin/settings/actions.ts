
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Not authorized');
  }
}

const settingsSchema = z.object({
  mapbox_api_key: z.string().optional(),
});

export async function updateSettings(values: z.infer<typeof settingsSchema>) {
    await checkAdmin();

    const parsedData = settingsSchema.safeParse(values);
    if (!parsedData.success) {
        return { error: 'Dados inválidos.' };
    }

    const { mapbox_api_key } = parsedData.data;

    const supabase = createServiceRoleClient();
    
    // Upsert the Mapbox key
    if (mapbox_api_key !== undefined) {
        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'mapbox_api_key', value: mapbox_api_key });

        if (error) {
            console.error("Error updating Mapbox key:", error);
            return { error: 'Erro ao guardar a chave de API do Mapbox.' };
        }
    }

    revalidatePath('/admin/settings');
    revalidatePath('/discoveries'); // Revalidate pages that might use the key
    
    return { success: true, message: 'Definições guardadas com sucesso!' };
}
