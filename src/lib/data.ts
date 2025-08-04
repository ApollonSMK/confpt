

import { Shield, ShieldCheck, ShieldHalf, Star, Gem, LucideIcon } from 'lucide-react';


// Tipos principais baseados no esquema do Supabase

export type DiscoveryImage = {
  imageUrl: string;
  imageHint?: string;
};

export type Discovery = {
  id: number;
  slug: string;
  title: string;
  description: string;
  editorial: string;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  type: string; 
  type_id: number;
  confraria_id: number;
  images: DiscoveryImage[]; // Array de imagens
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  confrarias?: Confraria; // Relação opcional
  confrariaId: number; // Para compatibilidade com componentes existentes
  imageUrl: string; // Para compatibilidade - será a primeira imagem da galeria
  imageHint: string; // Para compatibilidade
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
  articles?: Article[]; // Relação opcional
  recipes?: Recipe[]; // Relação opcional
  galleryImages?: ConfrariaGalleryImage[]; // Relação opcional
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
  type: number; // Agora é um ID
  confraria_id?: number | null;
  links?: string | null;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  discoveryTitle: string; // Para compatibilidade
  users?: { email: string | undefined }; // Relação opcional
  image_url?: string | null;
};

export type Event = {
  id: number;
  confraria_id: number;
  name: string;
  description?: string | null;
  event_date: string; // Vem como string do Supabase
  location?: string | null;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  image_url?: string | null;
  image_hint?: string | null;
  is_public: boolean;
  confrarias?: {
    name: string;
    seal_url: string;
    seal_hint: string;
  } | null;
};

export type Article = {
  id: number;
  created_at: string;
  confraria_id: number;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  image_url?: string | null;
  image_hint?: string | null;
  status: 'draft' | 'published';
  published_at?: string | null;
  confrarias?: {
      name: string;
  }
}

export type UserRankInfo = {
  rankName: string;
  rankIconName: keyof typeof rankIcons;
  rankIcon: LucideIcon;
  nextRankName: string | null;
  progress: number;
};

export type DiscoveryType = {
    id: number;
    name: string;
};

export type Testimonial = {
    id: number;
    content: string;
    created_at: string;
    user_id: string;
    discovery_id: number;
}

export type TestimonialWithUser = Testimonial & {
    user: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    }
}

export type Recipe = {
    id: number;
    confraria_id: number;
    author_id?: string | null;
    title: string;
    slug: string;
    description?: string | null;
    ingredients?: string | null;
    instructions?: string | null;
    prep_time_minutes?: number | null;
    cook_time_minutes?: number | null;
    servings?: number | null;
    image_url?: string | null;
    image_hint?: string | null;
    status: 'draft' | 'published';
    created_at: string;
    published_at?: string | null;
}

export type ConfrariaGalleryImage = {
    id: number;
    confraria_id: number;
    image_url: string;
    description?: string | null;
    sort_order: number;
}


// Dados estáticos para filtros, que não precisam estar no banco por enquanto
export const regions = ['Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira'] as const;


// Sistema de Ranks de Gamificação

export const rankIcons: { [key: string]: LucideIcon } = {
    ShieldHalf,
    Shield,
    ShieldCheck,
    Star,
    Gem,
};

export const ranks = [
  { name: 'Noviço', seals: 0, submissions: 0, iconName: 'ShieldHalf' as keyof typeof rankIcons },
  { name: 'Confrade', seals: 1, submissions: 1, iconName: 'Shield' as keyof typeof rankIcons },
  { name: 'Mestre de Prova', seals: 10, submissions: 2, iconName: 'ShieldCheck' as keyof typeof rankIcons },
  { name: 'Guardião da Tradição', seals: 25, submissions: 5, iconName: 'Star' as keyof typeof rankIcons },
  { name: 'Grão-Mestre', seals: 50, submissions: 10, iconName: 'Gem' as keyof typeof rankIcons },
];

export function getUserRank(sealedDiscoveriesCount: number, approvedSubmissionsCount: number, rankOverride?: string): UserRankInfo {
  
  if (rankOverride) {
    const overriddenRank = ranks.find(r => r.name === rankOverride);
    if (overriddenRank) {
      return {
        rankName: overriddenRank.name,
        rankIconName: overriddenRank.iconName,
        rankIcon: rankIcons[overriddenRank.iconName],
        nextRankName: null,
        progress: 100,
      };
    }
  }
  
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
    rankIconName: currentRank.iconName,
    rankIcon: rankIcons[currentRank.iconName],
    nextRankName: nextRank ? nextRank.name : null,
    progress: progress,
  };
}
