# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Redirecionamento do login para a página principal

Após um login bem-sucedido (resposta 200 de `POST /api/auth/login` com token válido), a aplicação SHALL armazenar a sessão retornada (`token` e `user`) e navegar para a página principal.

#### Scenario: Login válido navega para a página principal

- **WHEN** o login é enviado com credenciais válidas e a API responde 200 com token válido
- **THEN** a aplicação navega para a página principal

#### Scenario: Sessão armazenada após login

- **WHEN** o login é autenticado com sucesso
- **THEN** a aplicação armazena o token e os dados do usuário (`id`, `name`, `email` e `profiles`) retornados na resposta
