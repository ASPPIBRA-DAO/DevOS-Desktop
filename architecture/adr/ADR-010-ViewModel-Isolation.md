# ADR-010: ViewModel Isolation for UI Consumption

## Context
Diferentes provedores de autenticação (Firebase, Amplify, Custom API) retornam estruturas de usuário variáveis. Além disso, o DTO do banco de dados (ex: `AuthUser`) pode carregar propriedades sensíveis (senha hash, logs de login) ou metadados desnecessários para a visualização.

## Decision
Foi adotado o padrão **ViewModel** (`UserProfileViewModel`). 
A camada de infraestrutura/serviços de Identidade converterá a entidade `AuthUser` para um `UserProfileViewModel` formatado via **Transformers** antes de expor os dados. 
- Componentes visuais consumirāo apenas o `UserProfileViewModel` (nome seguro, avatar resolvido, badge calculado).
- Fim da injeção arbitrária de `useAuthContext()` nos módulos de UI. A UI utilizará exclusivamente o Hook `useUserProfile()`.

## Consequences
- O frontend UI fica invulnerável a quebras de DTO em caso de migração do backend de Autenticação.
- Separação limpa de Separation of Concerns (UI não resolve regras de negócios para gerar Iniciais ou Hashes de Cor).
