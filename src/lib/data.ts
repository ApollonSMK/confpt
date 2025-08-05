

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
  district: string;
  municipality: string;
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
  district: string;
  municipality: string;
  seal_url: string;
  seal_hint: string;
  cover_url?: string;
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
  district: string;
  municipality: string;
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
  district: string;
  municipality: string;
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

export const portugalDistricts = {
    "Aveiro": ["Águeda","Albergaria‑a‑Velha","Anadia","Arouca","Aveiro","Castelo de Paiva","Espinho","Estarreja","Ílhavo","Mealhada","Murtosa","Oliveira de Azeméis","Oliveira do Bairro","Ovar","São João da Madeira","Sever do Vouga","Vagos","Vale de Cambra"],
    "Beja": ["Aljustrel","Almodôvar","Alvito","Barrancos","Beja","Castro Verde","Cuba","Ferreira do Alentejo","Mértola","Moura","Odemira","Ourique","Serpa","Vidigueira"],
    "Braga": ["Amares","Barcelos","Braga","Cabeceiras de Basto","Celorico de Basto","Esposende","Fafe","Guimarães","Póvoa de Lanhoso","Terras de Bouro","Vieira do Minho","Vila Nova de Famalicão","Vila Verde","Vizela"],
    "Bragança": ["Alfândega da Fé","Bragança","Carrazeda de Ansiães","Freixo de Espada à Cinta","Macedo de Cavaleiros","Miranda do Douro","Mirandela","Mogadouro","Torre de Moncorvo","Vila Flor","Vimioso","Vinhais"],
    "Castelo Branco": ["Belmonte","Castelo Branco","Covilhã","Fundão","Idanha‑a‑Nova","Oleiros","Penamacor","Proença‑a‑Nova","Sertã","Vila de Rei","Vila Velha de Ródão"],
    "Coimbra": ["Arganil","Cantanhede","Coimbra","Condeixa‑a‑Nova","Figueira da Foz","Góis","Lousã","Mira","Miranda do Corvo","Montemor‑o‑Velho","Oliveira do Hospital","Pampilhosa da Serra","Penacova","Penela","Soure","Tábua","Vila Nova de Poiares"],
    "Évora": ["Alandroal","Arraiolos","Borba","Estremoz","Évora","Montemor‑o‑Novo","Mora","Mourão","Olivença","Portel","Redondo","Reguengos de Monsaraz","Vendas Novas","Viana do Alentejo","Vila Viçosa"],
    "Faro": ["Albufeira","Alcoutim","Aljezur","Castro Marim","Faro","Lagoa","Lagos","Loulé","Monchique","Olhão","Portimão","São Brás de Alportel","Silves","Tavira","Vila do Bispo","Vila Real de Santo António"],
    "Guarda": ["Aguiar da Beira","Almeida","Celorico da Beira","Figueira de Castelo Rodrigo","Fornos de Algodres","Gouveia","Guarda","Manteigas","Mêda","Pinhel","Sabugal","Seia","Trancoso","Vila Nova de Foz Côa"],
    "Leiria": ["Alcobaça","Alvaiázere","Ansião","Batalha","Bombarral","Caldas da Rainha","Castanheira de Pera","Figueiró dos Vinhos","Leiria","Marinha Grande","Nazaré","Óbidos","Pedrógão Grande","Peniche","Pombal","Porto de Mós"],
    "Lisboa": ["Alenquer","Amadora","Arruda dos Vinhos","Azambuja","Cadaval","Cascais","Lisboa","Loures","Lourinhã","Mafra","Odivelas","Oeiras","Sintra","Sobral de Monte Agraço","Torres Vedras","Vila Franca de Xira"],
    "Portalegre": ["Alter do Chão","Arronches","Avis","Campo Maior","Castelo de Vide","Crato","Elvas","Fronteira","Gavião","Marvão","Monforte","Nisa","Ponte de Sor","Portalegre","Sousel"],
    "Porto": ["Amarante","Baião","Felgueiras","Gondomar","Lousada","Maia","Marco de Canaveses","Matosinhos","Paços de Ferreira","Paredes","Penafiel","Porto","Póvoa de Varzim","Santo Tirso","Trofa","Valongo","Vila do Conde","Vila Nova de Gaia"],
    "Santarém": ["Abrantes","Alcanena","Almeirim","Alpiarça","Benavente","Cartaxo","Chamusca","Constância","Coruche","Entroncamento","Ferreira do Zêzere","Golegã","Mação","Ourém","Rio Maior","Salvaterra de Magos","Santarém","Sardoal","Tomar","Torres Novas","Vila Nova da Barquinha"],
    "Setúbal": ["Alcácer do Sal","Alcochete","Almada","Barreiro","Grândola","Moita","Montijo","Palmela","Santiago do Cacém","Seixal","Sesimbra","Setúbal","Sines"],
    "Viana do Castelo": ["Arcos de Valdevez","Caminha","Melgaço","Monção","Paredes de Coura","Ponte da Barca","Ponte de Lima","Valença","Viana do Castelo","Vila Nova de Cerveira"],
    "Vila Real": ["Alijó","Boticas","Chaves","Mesão Frio","Mondim de Basto","Montalegre","Murça","Peso da Régua","Ribeira de Pena","Sabrosa","Santa Marta de Penaguião","Valpaços","Vila Pouca de Aguiar","Vila Real"],
    "Viseu": ["Armamar","Carregal do Sal","Castro Daire","Cinfães","Lamego","Mangualde","Moimenta da Beira","Mortágua","Nelas","Oliveira de Frades","Penalva do Castelo","Penedono","Resende","Santa Comba Dão","São João da Pesqueira","São Pedro do Sul","Sátão","Sernancelhe","Tabuaço","Tarouca","Tondela","Vila Nova de Paiva","Viseu","Vouzela"],
    "Madeira": ["Calheta","Câmara de Lobos","Funchal","Machico","Ponta do Sol","Porto Moniz","Porto Santo","Ribeira Brava","Santa Cruz","Santana","São Vicente"],
    "Açores": ["Angra do Heroísmo","Calheta de São Jorge","Corvo","Horta","Lagoa","Lajes das Flores","Lajes do Pico","Madalena","Nordeste","Ponta Delgada","Povoação","Praia da Vitória","Ribeira Grande","Santa Cruz da Graciosa","Santa Cruz das Flores","São Roque do Pico","Velas","Vila do Porto","Vila Franca do Campo"]
  };

export const districts = Object.keys(portugalDistricts) as (keyof typeof portugalDistricts)[];

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

    