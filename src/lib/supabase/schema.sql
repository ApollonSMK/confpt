-- Apaga tabelas e tipos existentes para uma recriação limpa
drop table if exists "seals" cascade;
drop table if exists "discoveries" cascade;
drop table if exists "confrarias" cascade;
drop table if exists "submissions" cascade;
drop view if exists "discovery_seal_counts";
drop type if exists "region_enum";
drop type if exists "discovery_type_enum";
drop type if exists "submission_status_enum";
drop function if exists get_user_emails_by_ids;


-- Tipos ENUM para consistência de dados
create type region_enum as enum ('Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira');
create type discovery_type_enum as enum ('Produto', 'Lugar', 'Pessoa');
create type submission_status_enum as enum ('Pendente', 'Aprovado', 'Rejeitado');

-- Tabela das Confrarias
create table confrarias (
  id serial primary key,
  name text not null unique,
  motto text,
  region region_enum,
  seal_url text not null,
  seal_hint text not null
);

-- Tabela das Descobertas
create table discoveries (
  id serial primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  editorial text not null,
  region region_enum not null,
  type discovery_type_enum not null,
  confraria_id integer references confrarias(id) on delete set null,
  image_url text not null,
  image_hint text not null,
  address text,
  website text,
  phone text
);

-- Tabela das Submissões da Comunidade
create table submissions (
  id serial primary key,
  user_id uuid not null,
  discovery_title text not null,
  editorial text not null,
  region region_enum not null,
  type discovery_type_enum not null,
  confraria_id integer references confrarias(id) on delete set null,
  links text,
  image_data text,
  date date not null,
  status submission_status_enum not null,
  constraint submissions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

-- Tabela de Selos dos Confrades
create table seals (
  id serial primary key,
  user_id uuid not null,
  discovery_id integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint seals_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint seals_discovery_id_fkey foreign key (discovery_id) references discoveries(id) on delete cascade,
  unique (user_id, discovery_id)
);

-- View para contagem de selos por descoberta
create view discovery_seal_counts as
select
  discovery_id,
  count(*) as seal_count
from
  seals
group by
  discovery_id;

-- Função RPC para buscar emails de utilizadores de forma segura
create function get_user_emails_by_ids(p_user_ids uuid[])
returns table (id uuid, email text)
language sql
security definer
as $$
  select id, raw_user_meta_data->>'email' as email
  from auth.users
  where id = any(p_user_ids);
$$;

-- Dados Iniciais (Exemplos)
insert into confrarias (name, motto, region, seal_url, seal_hint) values
('Confraria do Vinho do Porto', 'In Vino Veritas', 'Norte', 'https://placehold.co/100x100.png', 'porto wine'),
('Confraria do Queijo da Serra', 'O Sabor da Montanha', 'Centro', 'https://placehold.co/100x100.png', 'serra cheese'),
('Confraria dos Sabores do Alentejo', 'Tradição à Mesa', 'Alentejo', 'https://placehold.co/100x100.png', 'alentejo food');

insert into discoveries (slug, title, description, editorial, region, type, confraria_id, image_url, image_hint, website) values
('vinho-do-porto-taylors', 'Vinho do Porto Taylor''s', 'Um néctar dos deuses envelhecido em caves seculares.', 'Cada gole conta uma história de gerações dedicadas à arte de criar o mais icónico dos vinhos portugueses. O aroma adocicado e a cor rubi intensa são um convite a uma experiência sensorial única, que perdura na memória muito depois de a taça estar vazia.', 'Norte', 'Produto', 1, 'https://placehold.co/600x400.png', 'wine bottle', 'https://www.taylor.pt'),
('queijo-serra-estrela-seia', 'Queijo da Serra da Estrela DOP', 'Aveludado, cremoso e com um sabor que ecoa as pastagens.', 'Feito com leite cru de ovelha Bordaleira, este queijo é o resultado de uma sabedoria ancestral. A sua pasta amanteigada e o sabor suave mas persistente fazem dele o rei dos queijos portugueses, uma verdadeira joia gastronómica.', 'Centro', 'Produto', 2, 'https://placehold.co/600x400.png', 'cheese wheel', 'https://www.google.com/search?q=Queijo+da+Serra+da+Estrela'),
('azeite-esporao', 'Azeite Esporão', 'O ouro líquido do Alentejo, intenso e frutado.', 'Das planícies alentejanas, este azeite virgem extra é um tributo à oliveira. Com notas de maçã, amêndoa e um final ligeiramente picante, é o companheiro perfeito para o pão quente e a alma da cozinha mediterrânica.', 'Alentejo', 'Produto', 3, 'https://placehold.co/600x400.png', 'olive oil', 'https://www.esporao.com/'),
('pasteis-de-belem', 'Pastéis de Belém', 'A receita original, um segredo bem guardado.', 'Mais do que um simples pastel de nata, é uma instituição. A massa folhada estaladiça e o creme dourado, polvilhado com canela, são uma peregrinação obrigatória em Lisboa. O segredo da receita, guardado a sete chaves desde 1837, torna cada dentada um momento de pura felicidade.', 'Lisboa', 'Lugar', null, 'https://placehold.co/600x400.png', 'custard tart', 'https://pasteisdebelem.pt/'),
('livraria-lello', 'Livraria Lello', 'Uma catedral de livros no coração do Porto.', 'Com a sua escadaria carmim icónica e vitrais deslumbrantes, a Livraria Lello é um santuário para os amantes da literatura. Cada prateleira e detalhe arquitetónico contam histórias, inspirando visitantes de todo o mundo. É um lugar onde a magia dos livros ganha vida.', 'Norte', 'Lugar', null, 'https://placehold.co/600x400.png', 'bookstore interior', 'https://www.livrarialello.pt/'),
('amalia-rodrigues', 'Amália Rodrigues', 'A voz eterna do Fado.', 'Amália não cantava o Fado, ela era o Fado. A sua voz poderosa e a sua interpretação visceral levaram a alma portuguesa aos quatro cantos do mundo. Honrar Amália é honrar a saudade, a paixão e a essência de um povo, um legado que continua a ecoar nas ruas de Alfama.', 'Lisboa', 'Pessoa', null, 'https://placehold.co/600x400.png', 'singer portrait', 'https://pt.wikipedia.org/wiki/Am%C3%A1lia_Rodrigues');
