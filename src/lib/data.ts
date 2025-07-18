import { supabase } from "./supabase";
import { createServerClient } from './supabase/server';

// Tipos principais baseados no esquema do Supabase

export type Discovery = {
  id: number;
  slug: string;
  title: string;
  description: string;
  editorial: string;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  type: 'Produto' | 'Lugar' | 'Pessoa';
  confraria_id: number;
  image_url: string;
  image_hint: string;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  confrarias?: Confraria; // Relação opcional
  confrariaId: number; // Para compatibilidade com componentes existentes
  imageUrl: string;
  imageHint: string;
  contextualData?: {
    address?: string | null;
    website?: string | null;
    phone?: string | null;
  };
  seal_count: number;
  user_has_sealed: boolean;
};

export type Confraria = {
  id: number;
  name: string;
  motto: string;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  seal_url: string;
  seal_hint: string;
  discoveries?: Discovery[]; // Relação opcional
  sealUrl: string; // Para compatibilidade
  sealHint: string; // Para compatibilidade
  discoveryCount?: number;
};

export type Submission = {
  id: number;
  discovery_title: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  discoveryTitle: string; // Para compatibilidade
};


// Funções para buscar dados do Supabase

export async function getDiscoveries(user_id?: string): Promise<Discovery[]> {
    const { data, error } = await supabase
        .from('discoveries')
        .select(`
            *,
            confrarias (
                id,
                name,
                seal_url,
                seal_hint
            ),
            discovery_seal_counts (
                seal_count
            )
        `);

    if (error) {
        console.error('Error fetching discoveries:', error);
        return [];
    }

    let userSeals = new Set<number>();
    if (user_id) {
        const { data: sealsData } = await supabase.from('seals').select('discovery_id').eq('user_id', user_id);
        if (sealsData) {
            userSeals = new Set(sealsData.map(s => s.discovery_id));
        }
    }
    
    return data.map(d => ({
        ...d,
        confrariaId: d.confraria_id,
        imageUrl: d.image_url,
        imageHint: d.image_hint,
        contextualData: {
            address: d.address,
            website: d.website,
            phone: d.phone
        },
        confrarias: d.confrarias ? { ...d.confrarias, sealUrl: d.confrarias.seal_url, sealHint: d.confrarias.seal_hint } : undefined,
        seal_count: d.discovery_seal_counts[0]?.seal_count || 0,
        user_has_sealed: userSeals.has(d.id),
    })) as unknown as Discovery[];
}


export async function getConfrarias(): Promise<(Confraria & { discoveryCount: number })[]> {
    const { data, error } = await supabase
        .from('confrarias')
        .select(`
            *,
            discoveries (
                id
            )
        `);

    if (error) {
        console.error('Error fetching confrarias:', error);
        return [];
    }
    
    return data.map(c => ({
        ...c,
        sealUrl: c.seal_url,
        sealHint: c.seal_hint,
        discoveryCount: c.discoveries.length
    })) as (Confraria & { discoveryCount: number })[];
}

export async function getSubmissions(): Promise<Submission[]> {
    const { data, error } = await supabase.from('submissions').select('*');
    if (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
    })) as Submission[];
}


// Dados estáticos para filtros, que não precisam estar no banco por enquanto
export const regions = ['Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira'];
export const discoveryTypes = ['Produto', 'Lugar', 'Pessoa'];
