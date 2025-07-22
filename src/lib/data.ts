
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
  responsible_user_id?: string | null;
  discoveries?: Discovery[]; // Relação opcional
  events?: Event[]; // Relação opcional
  sealUrl: string; // Para compatibilidade
  sealHint: string; // Para compatibilidade
  discoveryCount?: number;
};

export type Submission = {
  id: number;
  user_id: string;
  discovery_title: string;
  editorial: string;
  region: string;
  type: string;
  confraria_id?: number | null;
  links?: string | null;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  discoveryTitle: string; // Para compatibilidade
  users?: { email: string | undefined }; // Relação opcional
};

export type Event = {
  id: number;
  confraria_id: number;
  name: string;
  description?: string | null;
  event_date: string; // Vem como string do Supabase
  location?: string | null;
  image_url?: string | null;
  image_hint?: string | null;
  is_public: boolean;
  confrarias?: {
    name: string;
    seal_url: string;
    seal_hint: string;
  } | null;
};

export type UserRankInfo = {
  rankName: string;
  rankIcon: LucideIcon;
  nextRankName: string | null;
  progress: number;
};


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
