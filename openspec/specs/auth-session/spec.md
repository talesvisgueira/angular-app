# auth-session Specification

## Purpose

Definir o fluxo de sessão no frontend: armazenamento da sessão após um login bem-sucedido, redirecionamento do login para a página principal, persistência da sessão durante a aba e redirecionamento de acessos não autenticados.

## Requirements

### Requirement: Redirecionamento do login para a página principal

Após um login bem-sucedido (resposta 200 de `POST /api/auth/login` com token válido), a aplicação SHALL armazenar a sessão retornada (`token` e `user`) e navegar para a página principal.

#### Scenario: Login válido navega para a página principal

- **WHEN** o login é enviado com credenciais válidas e a API responde 200 com token válido
- **THEN** a aplicação navega para a página principal

#### Scenario: Sessão armazenada após login

- **WHEN** o login é autenticado com sucesso
- **THEN** a aplicação armazena o token e os dados do usuário (`id`, `name`, `email` e `profiles`) retornados na resposta

### Requirement: Falha de login permanece na tela de login

Quando o login falha (respostas 400 ou 401 de `POST /api/auth/login`), a aplicação SHALL permanecer na tela de login, exibir a mensagem de erro e NÃO navegar para a página principal nem armazenar sessão.

#### Scenario: Credenciais inválidas permanecem no login

- **WHEN** o login é enviado com credenciais inválidas e a API responde 401
- **THEN** a aplicação permanece na tela de login, exibe a mensagem de erro e nenhuma sessão é armazenada

### Requirement: Sessão persiste durante a aba

A aplicação SHALL manter a sessão ativa durante a mesma aba do navegador, de forma que recarregar a página principal mantenha o usuário autenticado e seus dados visíveis no banner.

#### Scenario: Refresh mantém a sessão

- **WHEN** a página principal é recarregada na mesma aba com uma sessão ativa
- **THEN** a tela principal é exibida novamente com os dados do usuário autenticado no banner

### Requirement: Acesso não autenticado redireciona para o login

A aplicação SHALL redirecionar para a tela de login qualquer acesso à página principal sem sessão ativa. Além disso, o direcionamento de entrada sem sessão SHALL considerar a existência de usuários cadastrados (`GET /api/auth/has-users`): sem nenhum usuário, a aplicação SHALL direcionar para a tela de cadastro inicial (`/signup`) em vez da tela de login, tanto na decisão da splash quanto ao abrir a tela de login.

#### Scenario: Página principal sem sessão

- **WHEN** a página principal é acessada diretamente sem sessão ativa
- **THEN** a aplicação redireciona para a tela de login

#### Scenario: Rota inicial

- **WHEN** a aplicação é aberta na rota vazia
- **THEN** a aplicação redireciona para a página principal, que por sua vez redireciona para o login quando não há sessão ativa

#### Scenario: Splash sem usuários cadastrados direciona ao cadastro

- **WHEN** a splash termina sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: false }`
- **THEN** a aplicação navega para `/signup` em vez da tela de login

#### Scenario: Splash com usuários cadastrados direciona ao login

- **WHEN** a splash termina sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: true }`
- **THEN** a aplicação navega para a tela de login

#### Scenario: Tela de login sem usuários cadastrados redireciona ao cadastro

- **WHEN** a tela de login é aberta sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: false }`
- **THEN** a aplicação redireciona para `/signup`

#### Scenario: Tela de login com usuários cadastrados permanece

- **WHEN** a tela de login é aberta sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: true }`
- **THEN** a aplicação permanece na tela de login

### Requirement: Logout encerra a sessão

Quando o botão de logout da toolbar é acionado, a aplicação SHALL encerrar a sessão: remover o token e os dados do usuário, inclusive o espelho da sessão no armazenamento da aba, e navegar para a tela de login.

#### Scenario: Sessão removida após logout

- **WHEN** o usuário autenticado aciona o botão de logout (Sair) na toolbar
- **THEN** a sessão é removida e nenhum token ou dado de usuário permanece armazenado na aba

#### Scenario: Logout redireciona para o login

- **WHEN** o usuário autenticado aciona o botão de logout
- **THEN** a aplicação navega para a tela de login

#### Scenario: Refresh após logout não restaura a sessão

- **WHEN** a página é recarregada na mesma aba após o logout
- **THEN** nenhuma sessão é restaurada e a aplicação permanece na tela de login

### Requirement: Botão de login navega para a tela de login

Sem sessão ativa, a aplicação SHALL navegar para a tela de login quando o botão de login da toolbar for acionado.

#### Scenario: Clique no botão de login sem sessão

- **WHEN** o botão de login (Entrar) é acionado sem sessão ativa
- **THEN** a aplicação navega para a tela de login

### Requirement: Token recebido no login é validado antes de virar sessão

Quando `POST /api/auth/login` responde 200, a aplicação SHALL validar o token recebido (estrutura de JWT com payload decodificável e `exp` no futuro) antes de armazenar a sessão; se o token for estruturalmente inválido ou estiver expirado, a aplicação SHALL permanecer na tela de login com mensagem de erro e NÃO armazenar sessão nem navegar para a página principal.

#### Scenario: Token válido cria a sessão

- **WHEN** o login responde 200 com um token JWT estruturalmente válido e não expirado
- **THEN** a sessão é armazenada e a aplicação navega para a página principal

#### Scenario: Token inválido não cria a sessão

- **WHEN** o login responde 200 com um token que não é um JWT estruturalmente válido ou já está expirado
- **THEN** a aplicação permanece na tela de login com mensagem de erro, não armazena sessão e não navega para a página principal

### Requirement: Sessão armazenada só permanece com token válido

A aplicação SHALL validar o token da sessão armazenada (estrutura de JWT e `exp`) ao restaurar a sessão e ao autorizar acesso a rotas protegidas: com token válido a sessão é mantida; com token expirado ou estruturalmente inválido a sessão SHALL ser descartada e o usuário SHALL ser tratado como não autenticado, sendo direcionado ao login.

#### Scenario: Sessão restaurada com token válido

- **WHEN** a página é recarregada na mesma aba com uma sessão cujo token é válido e não expirado
- **THEN** a sessão é restaurada e o usuário permanece autenticado

#### Scenario: Sessão descartada com token expirado

- **WHEN** a aplicação é aberta com uma sessão cujo token já passou do `exp`
- **THEN** a sessão é descartada e o usuário é direcionado para a tela de login

#### Scenario: Sessão descartada com token inválido

- **WHEN** a aba contém uma sessão cujo token não é estruturalmente válido (por exemplo, editado manualmente no armazenamento)
- **THEN** a sessão é descartada e o usuário é tratado como não autenticado

#### Scenario: Rota protegida com token expirado

- **WHEN** uma rota protegida é acessada com sessão cujo token está expirado
- **THEN** a aplicação descarta a sessão e redireciona para a tela de login

### Requirement: Perfis do usuário disponíveis na sessão

Com sessão ativa, a aplicação SHALL tornar disponíveis para a interface os perfis (`profiles`) do usuário autenticado, obtidos da resposta de login e preservados na sessão armazenada e restaurada.

#### Scenario: Perfis disponíveis durante a sessão

- **WHEN** existe sessão ativa criada pelo login ou restaurada da aba
- **THEN** os perfis do usuário autenticado estão disponíveis para a aplicação, vazios quando o usuário não possui perfis

### Requirement: Cadastro inicial estabelece sessão

Quando `POST /api/auth/setup` responde 201, a aplicação SHALL validar o token recebido (estrutura de JWT com payload decodificável e `exp` no futuro) e estabelecer a sessão da mesma forma que um login: armazenar `token` e `user` e navegar para a página principal. Com token estruturalmente inválido ou expirado, a aplicação SHALL permanecer na tela de cadastro com mensagem de erro, sem armazenar sessão.

#### Scenario: Cadastro bem-sucedido cria a sessão

- **WHEN** o cadastro inicial responde 201 com um token JWT estruturalmente válido e não expirado
- **THEN** a sessão é armazenada e a aplicação navega para a página principal

#### Scenario: Token inválido na resposta do cadastro não cria a sessão

- **WHEN** o cadastro inicial responde 201 com um token que não é um JWT estruturalmente válido ou já está expirado
- **THEN** a aplicação permanece em `/signup` com mensagem de erro, não armazena sessão e não navega para a página principal
