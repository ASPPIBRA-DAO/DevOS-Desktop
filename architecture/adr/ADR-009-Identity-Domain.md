# ADR-009: Identity as a Bounded Context

## Context
Historicamente, dados do usuário autenticado e a lógica de exibição de Avatares eram espalhadas por toda a aplicação. Módulos como Chat, Banking, e Layout acessavam a estrutura bruta do usuário (`AuthUser`), criando alto acoplamento e vazamento de responsabilidades.

## Decision
Foi decidido consolidar toda a inteligência e acesso de usuário no domínio corporativo **Identity**, aplicando estritos limites arquiteturais (Bounded Contexts) baseados em Domain-Driven Design (DDD).

- A UI da aplicação **NUNCA** acessará componentes que não sejam `<IdentityAvatar>`, `<IdentityUserChip>` ou `<IdentityUserCard>`.
- O módulo **Identity** possuirá Ownership total da pasta `src/auth/`.

## Consequences
- Redução brutal na repetição de código.
- Maior escalabilidade e blindagem na evolução dos DTOs de autenticação.
- Obrigatoriedade de refatorar outras UIs em caso de adição de novas capacidades à identidade.
