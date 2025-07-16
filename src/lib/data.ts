export type Discovery = {
  id: number;
  slug: string;
  title: string;
  description: string;
  editorial: string;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  type: 'Produto' | 'Lugar' | 'Pessoa';
  confrariaId: number;
  imageUrl: string;
  imageHint: string;
  contextualData?: {
    address?: string;
    website?: string;
    phone?: string;
  };
};

export type Confraria = {
  id: number;
  name: string;
  motto: string;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  sealUrl: string;
  sealHint: string;
};

export type Submission = {
  id: number;
  discoveryTitle: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
};

export const confrarias: Confraria[] = [
  { id: 1, name: 'Confraria do Vinho do Porto', motto: 'Na tradição, o futuro', region: 'Norte', sealUrl: 'https://placehold.co/100x100.png', sealHint: 'heraldic seal' },
  { id: 2, name: 'Confraria Gastronómica do Leitão da Bairrada', motto: 'Crocante por fora, tenro por dentro', region: 'Centro', sealUrl: 'https://placehold.co/100x100.png', sealHint: 'roast pig' },
  { id: 3, name: 'Confraria do Queijo de São Jorge', motto: 'A ilha no sabor', region: 'Açores', sealUrl: 'https://placehold.co/100x100.png', sealHint: 'cheese wheel' },
  { id: 4, name: 'Confraria dos Enófilos do Alentejo', motto: 'A alma da planície', region: 'Alentejo', sealUrl: 'https://placehold.co/100x100.png', sealHint: 'wine cork' },
  { id: 5, name: 'Confraria do Medronho "Os Monchiqueiros"', motto: 'O fogo que aquece a alma', region: 'Algarve', sealUrl: 'https://placehold.co/100x100.png', sealHint: 'fruit berry' },
];

export const discoveries: Discovery[] = [
  {
    id: 1,
    slug: 'quinta-do-noval',
    title: 'Quinta do Noval',
    description: 'Um refúgio de silêncio e vinho no coração do Douro.',
    editorial: 'Visitar a Quinta do Noval é mais do que uma prova de vinhos; é uma imersão na história viva do Vinho do Porto. As vinhas centenárias, os lagares tradicionais e a paisagem avassaladora criam uma experiência que fica na memória e no paladar.',
    region: 'Norte',
    type: 'Lugar',
    confrariaId: 1,
    imageUrl: 'https://placehold.co/800x600.png',
    imageHint: 'wine vineyard',
    contextualData: {
      address: 'Quinta do Noval, 5085-010 Pinhão, Portugal',
      website: 'https://quintadonoval.com',
    },
  },
  {
    id: 2,
    slug: 'leitao-da-bairrada-meta-dos-leitoes',
    title: 'Leitão da Bairrada, Meta dos Leitões',
    description: 'A pele estaladiça que canta a canção da tradição.',
    editorial: 'Na Meta dos Leitões, a arte de assar leitão é levada a sério. Cada peça é um testemunho de mestria, com uma pele de vidro e uma carne que se desfaz. É um ícone da Bairrada que exige ser provado com tempo e devoção.',
    region: 'Centro',
    type: 'Produto',
    confrariaId: 2,
    imageUrl: 'https://placehold.co/800x600.png',
    imageHint: 'roast pig',
    contextualData: {
      address: 'Rua da tranquilidade, Mealhada, Portugal',
      website: 'https://metadosleitoes.pt',
    },
  },
  {
    id: 3,
    slug: 'queijo-sao-jorge-12-meses',
    title: 'Queijo São Jorge 12 Meses',
    description: 'O sabor picante e complexo de uma ilha vulcânica.',
    editorial: 'Este não é um queijo qualquer. Doze meses de cura dão-lhe uma complexidade e um picante que desafiam o palato. Cada lasca é uma viagem à paisagem verdejante e ao ar salgado dos Açores. Perfeito com um vinho do Porto ou um pão rústico.',
    region: 'Açores',
    type: 'Produto',
    confrariaId: 3,
    imageUrl: 'https://placehold.co/800x600.png',
    imageHint: 'cheese wheel',
  },
  {
    id: 4,
    slug: 'jose-de-sousa-mayor',
    title: 'José de Sousa, Enólogo',
    description: 'O guardião das talhas de barro e dos vinhos ancestrais.',
    editorial: 'José de Sousa não é apenas um enólogo; é um arqueólogo do vinho. Resgatou a técnica romana de vinificação em talhas de barro, criando vinhos que são um elo direto com o passado. A sua paixão e sabedoria são tão inebriantes quanto os seus vinhos.',
    region: 'Alentejo',
    type: 'Pessoa',
    confrariaId: 4,
    imageUrl: 'https://placehold.co/800x600.png',
    imageHint: 'old man portrait',
  },
  {
    id: 5,
    slug: 'aguardente-de-medronho',
    title: 'Aguardente de Medronho',
    description: 'O espírito selvagem da serra algarvia, destilado.',
    editorial: 'Feita do fruto vermelho do medronheiro, esta aguardente é a alma da Serra de Monchique. Uma bebida potente, frutada e complexa, que aquece o corpo e a alma. Um tesouro escondido, destilado em alambiques de cobre por mestres artesãos.',
    region: 'Algarve',
    type: 'Produto',
    confrariaId: 5,
    imageUrl: 'https://placehold.co/800x600.png',
    imageHint: 'distillery copper',
  },
  {
    id: 6,
    slug: 'herdade-do-esporao',
    title: 'Herdade do Esporão',
    description: 'Onde o vinho, o azeite e a arte se encontram na planície.',
    editorial: 'O Esporão é um ecossistema de cultura no coração do Alentejo. Para além dos vinhos e azeites de classe mundial, oferece uma experiência completa que une gastronomia, enoturismo e arte. Um exemplo de como a modernidade pode honrar a tradição.',
    region: 'Alentejo',
    type: 'Lugar',
    confrariaId: 4,
    imageUrl: 'https://placehold.co/800x600.png',
    imageHint: 'olive grove',
    contextualData: {
      address: 'Herdade do Esporão, 7200-094 Reguengos de Monsaraz',
      website: 'https://esporao.com',
    },
  },
];

export const userSubmissions: Submission[] = [
  { id: 1, discoveryTitle: 'Pastel de Tentúgal', date: '2024-05-15', status: 'Aprovado' },
  { id: 2, discoveryTitle: 'Restaurante "O Pescador"', date: '2024-06-01', status: 'Pendente' },
  { id: 3, discoveryTitle: 'Licor de Ginja de Óbidos', date: '2024-04-20', status: 'Rejeitado' },
];

export const regions = ['Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira'];
export const discoveryTypes = ['Produto', 'Lugar', 'Pessoa'];
