# ADR-011: Facades as Anti-Corruption Layers

## Context
Módulos externos independentes, como **Chat** e **Banking**, precisavam interagir com operações pesadas de identidade (Atualizar Perfil, Obter Presença Realtime) sem acoplar fortemente aos repositórios.

## Decision
Foi criada uma camada pública de **Facades** no domínio Identity:
- `ProfileFacade`
- `PresenceFacade`
- `AvatarFacade`

Estas Facades atuarão como *Anti-Corruption Layers*. Domínios externos consumirão essas Facades em vez de acessar lógicas internas do Identity. Internamente, os componentes visuais de identidade (ex: `IdentityAvatar`) estão isentos dessa limitação e podem se abastecer via Hooks diretamente.

## Consequences
- Qualquer mudança estrutural interna na API de Autenticação não corromperá módulos consumidores. O contrato da Facade permanecerá o mesmo.
- Inversão de dependência forçada pela arquitetura.
