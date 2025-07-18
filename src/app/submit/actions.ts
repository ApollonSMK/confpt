'use server';

import { createServerClient } from "@/lib/supabase/server";
import { type Submission } from "@/lib/data";

export async function getSubmissions(): Promise<Submission[]> {
    const supabase = createServerClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase.from('submissions').select('*').eq('user_id', user.id);
    if (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
    })) as Submission[];
}
