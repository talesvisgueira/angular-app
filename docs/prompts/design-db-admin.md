# Contexto do Projeto e Diretrizes do Agente

Você está atuando como Engenheiro de Software especialista em um ecossistema Monorepo estruturado com **pnpm**. O projeto possui um backend (@monorepo/backend) com **Node.js** Fastify API que necessita criar o banco de dados **SQLite** utilizando ORM **TypeORM** .

## 🏗️ Domínios do Sistema

O sistema é baseado em controle de acesso granular (RBAC) estruturado nos seguintes domínios. Ao criar entidades, tabelas ou componentes, respeite estritamente este modelo de dados:

1. **Pessoa (`Person`)**: Tenant/Escopo isolador principal do sistema com ID varchar(36) not null primary key, codigo varchar(15) not null unique, name varchar(150) not null, short_name varchar(20) not null unique, description varchar(400) null, e-mail varchar(100) not null unique.
2. **Organização (`Organization`)**: Gereneralização de Pessoa endereco varchar(100) not null, bairro varchar(80) not null, .
3. **Usuário (`User`)**: Entidade de autenticação atrelada a uma Pessoa.
4. **Organização Usuário (`Organization_User`)**:
5. **Perfil (`Profile`)**: Papéis ou regras de acesso atribuídas ao Usuário (ex: Admin, Usuário Padrão).
6. **Módulo (`Module`)**: Áreas ou funcionalidades do sistema (ex: Financeiro, Relatórios).
7. **Módulo_Rule (`ModuleRule`)**: Ações/Permissões específicas de um módulo (ex: `criar_relatorio`, `deletar_usuario`).
8. **Perfil_Rule (`ProfileRule`)**: Tabela pivot/relação que mapeia quais perfis têm quais regras de módulos.
9. **Organização Usuario Perfil (`OrganizationUserProfile`)**: Tabela pivot/relação que mapeia quais perfis de usuário da organização.

## ⚙️ Diretrizes do Backend (Node.js + TypeORM)

- **SQLite & Migrations:** Nunca altere as entidades do TypeORM esperando que o banco sincronize automaticamente (`synchronize: false` em produção/desenvolvimento estruturado). Sempre gere arquivos de **migration** explicitando as alterações nas tabelas dos domínios.
- **Boas Práticas de Banco de Dados:**
  - Use UUIDs para chaves primárias.
  - Certifique-se de que a coluna `organization_id` esteja presente e indexada em todas as tabelas dependentes para garantir o isolamento de dados (Multi-tenancy).
- Todas as tabelas deve possuir os campos user_created e data_create.

---

## 🤖 Regras de Comportamento da IA

1. **Antes de escrever código:** Verifique se a alteração afeta as regras de negócio dos domínios de acesso (Perfil/Regras).
2. **Ao criar tabelas/colunas:** Escreva a entidade TypeORM e forneça imediatamente o comando/código da Migration correspondente.
3. **Padrão de Código:** Siga o padrão Clean Code, tipagem estrita no TypeScript e tratamento centralizado de erros no backend.
