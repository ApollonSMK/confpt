import { supabase } from "./supabase";
import { createServerClient } from './supabase/server';
import { Shield, ShieldCheck, ShieldHalf, Star, Gem } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';


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
  user_id: string;
  discovery_title: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  discoveryTitle: string; // Para compatibilidade
  users?: { email: string | undefined }; // Relação opcional
};

export type UserRankInfo = {
  rankName: string;
  rankIcon: LucideIcon;
  nextRankName: string | null;
  progress: number;
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

export async function getSubmissionsForUser(userId: string): Promise<Submission[]> {
    if (!userId) {
        console.warn('No userId provided to getSubmissionsForUser');
        return [];
    }

    const { data, error } = await supabase.from('submissions').select('*').eq('user_id', userId).order('date', { ascending: false });
    
    if (error) {
        console.error('Error fetching submissions for user:', error);
        return [];
    }

    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
    })) as Submission[];
}


export async function getSubmissionsByStatus(status: 'Pendente' | 'Aprovado' | 'Rejeitado'): Promise<Submission[]> {
    const { data, error } = await supabase
        .from('submissions')
        .select(`
            *,
            users (
                email
            )
        `)
        .eq('status', status)
        .order('date', { ascending: true });

    if (error) {
        console.error(`Error fetching ${status} submissions:`, error);
        return [];
    }

    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
        users: s.users ? { email: s.users.email } : { email: 'Utilizador Desconhecido' },
    })) as unknown as Submission[];
}


export async function getSealedDiscoveriesForUser(userId: string): Promise<Discovery[]> {
    const { data: seals, error: sealsError } = await supabase
        .from('seals')
        .select('discovery_id')
        .eq('user_id', userId);

    if (sealsError || !seals || seals.length === 0) {
        return [];
    }

    const discoveryIds = seals.map(s => s.discovery_id);

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
        `)
        .in('id', discoveryIds);

     if (error) {
        console.error('Error fetching sealed discoveries:', error);
        return [];
    }

    // Since this is for the user's profile, they have sealed all of these.
    const userSeals = new Set(discoveryIds);
    
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
        seal_count: d.discovery_seal_counts.length > 0 ? d.discovery_seal_counts[0].seal_count : 0,
        user_has_sealed: userSeals.has(d.id),
    })) as unknown as Discovery[];
}


// Dados estáticos para filtros, que não precisam estar no banco por enquanto
export const regions = ['Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira'] as const;
export const discoveryTypes = ['Produto', 'Lugar', 'Pessoa'] as const;

// Sistema de Ranks de Gamificação
const ranks = [
  { name: 'Noviço', seals: 0, submissions: 0, icon: ShieldHalf },
  { name: 'Confrade', seals: 1, submissions: 1, icon: Shield },
  { name: 'Mestre de Prova', seals: 10, submissions: 2, icon: ShieldCheck },
  { name: 'Guardião da Tradição', seals: 25, submissions: 5, icon: Star },
  { name: 'Grão-Mestre', seals: 50, submissions: 10, icon: Gem },
];

export function getUserRank(sealedDiscoveriesCount: number, approvedSubmissionsCount: number) {
  let currentRank = ranks[0];

  for (const rank of ranks) {
    if (sealedDiscoveriesCount >= rank.seals && approvedSubmissionsCount >= rank.submissions) {
      currentRank = rank;
    }
  }

  const currentRankIndex = ranks.findIndex(r => r.name === currentRank.name);
  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;

  let progress = 0;
  if (nextRank) {
    const sealsProgress = sealedDiscoveriesCount / nextRank.seals;
    const submissionsProgress = approvedSubmissionsCount / nextRank.submissions;
    // O progresso é a média do progresso em selos e submissões
    progress = Math.min(((sealsProgress + submissionsProgress) / 2) * 100, 100);
  } else {
    // Se for o último rank, o progresso é 100%
    progress = 100;
  }
  
  return {
    rankName: currentRank.name,
    rankIcon: currentRank.icon,
    nextRankName: nextRank ? nextRank.name : null,
    progress: progress,
  };
}
