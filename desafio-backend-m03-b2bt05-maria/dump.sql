create table usuarios (
	id serial primary key,
  nome varchar(255) not null,
  email varchar(255) not null unique,
  senha varchar(255) not null
);

create table categorias (
	id serial primary key,
  descricao text
);
insert into categorias (descricao)
values 
('Alimentação'),
('Assinaturas e Serviços'),
('Casa'),
('Mercado'),
('Cuidados Pessoais'),
('Educação'),
('Família'),
('Lazer'),
('Pets'),
('Presentes'),
('Roupas'),
('Saúde'),
('Transporte'),
('Salário'),
('Vendas'),
('Outras receitas'),
('Outras despesas');

create table transacoes (
id serial primary key,
descricao text,
valor decimal,
data date,
categoria_id int,
usuario_id int,
tipo text
);

alter table transacoes
add constraint fk_transacoes_categoria_id
foreign key (categoria_id) references categorias(id);

alter table transacoes
add constraint fk_transacoes_usuario_id
foreign key (usuario_id) references usuarios(id);
