# Contexto do Projeto e Diretrizes do Agente

Como Engenheiro de Software especialista em um ecossistema Monorepo estruturado com **pnpm**. O projeto possui um backend (@monorepo/backend) com **No>

## Requisitos do módulo de administração

1. Delete o campo organization_id da tabela user.
2. Delete o campo person_id da tabela organization.
3. Create a constraint foreign key fk_user_person_person_id na tabela user references person.
4. Create a constraint foreign key fk_organization_person_person_id na tabela organization references person.
5. Crie os endpoints de CRUD para as tabelas existentes no banco de dados.
6. Configure o swagger no backend para documentar os enpoints existentes.

## ⚙️ Diretrizes do Backend (Node.js + TypeORM)

- **SQLite & Migrations:** Nunca altere as entidades do TypeORM esperando que o banco sincronize automaticamente (`synchronize: false`)
- **Boas Práticas de Banco de Dados:**
- Use UUIDs para chaves primárias.
- Todas as tabelas deve possuir os campos user_created varchar(36) not null e data_created timestamp not null, data_updated timestamp not null.

## 🤖 Regras de Comportamento da IA

1. **Antes de escrever código:** Verifique se a alteração afeta as regras de negócio dos domínios de acesso (Perfil/Regras).
2. **Ao criar tabelas/colunas:** Escreva a entidade TypeORM e forneça imediatamente o comando/código da Migration correspondente.
3. **Padrão de Código:** Siga o padrão Clean Code, tipagem estrita no TypeScript e tratamento centralizado de erros no backend.
4. **Altere apenas o backend e mão faça alterações no frontend**
