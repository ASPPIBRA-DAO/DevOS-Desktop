# 08 — Classificação do Status Funcional das Cinco Abas

## 1. Critérios de Classificação

Cada funcionalidade identificada na Central de Identidade Digital foi categorizada rigorosamente de acordo com os critérios da auditoria:

* **IMPLEMENTADA E CONECTADA:** Possui implementação funcional ponta a ponta (React -> IPC Tauri -> Rust -> SQLite).
* **IMPLEMENTADA PARCIALMENTE:** Possui componentes, contratos ou persistência, mas com integrações incompletas.
* **MOCK / SIMULAÇÃO:** Exibe interfaces ou notificações de sucesso sem executar operação real no backend.
* **SOMENTE INTERFACE:** Elemento puramente visual sem intenção de manipulação de dados ou sem handlers.
* **NÃO UTILIZADA:** Código ou componente sem rota ou ponto de entrada ativo.
* **NÃO VERIFICADA:** Sem evidência suficiente no repositório.

---

## 2. Matriz de Classificação Funcional por Aba

### 2.1 ABA 1 — Perfil Geral / Identidade Civil (`/user/account`)
| Funcionalidade | Status | Detalhes Técnicos |
|---|---|---|
| Edição Cadastral PF (Nome, CPF, RG, CNH, Filiação, Endereço, Contato) | **IMPLEMENTADA E CONECTADA** | Integração total via `IdentityBridge.saveUserProfile`, cálculo de escore e persistência cifrada em SQLite. |
| Edição Cadastral PJ (Razão Social, CNPJ, Rep. Legal, Endereço, Contato) | **IMPLEMENTADA E CONECTADA** | Suporte completo a CNPJ numérico e alfanumérico, preservação de campos em alternância PF/PJ. |
| Cálculo de Completeness Score (0 a 100%) | **IMPLEMENTADA E CONECTADA** | Algoritmo determinístico tanto no frontend (`calculateIdentityCompleteness`) quanto no Rust (`calculate_completeness_score`). |
| Visualização de Privacidade (Perfil Público/Privado) | **IMPLEMENTADA E CONECTADA** | Persistência do booleano `isPublic` e geração de projeção pública segura no Rust com allowlist de campos. |
| Migração Segura de Dados Legados (`localStorage`) | **IMPLEMENTADA E CONECTADA** | Detecção automática, importação segura com verificação de integridade e remoção pós-leitura de volta. |
| Resolução de Conflitos de Migração (`keep_vault` vs `merge_legacy`) | **IMPLEMENTADA E CONECTADA** | Bloqueio de concorrência, leitura independente de confirmação e exclusão atômica do legado. |

### 2.2 ABA 2 — Notificações (`/user/account/notifications`)
| Funcionalidade | Status | Detalhes Técnicos |
|---|---|---|
| Seleção de Canais (E-mail, SMS, WhatsApp, Push Desktop) | **SOMENTE INTERFACE** | Switches visuais operam no estado local do formulário sem efeito colateral. |
| Seleção de Eventos (Comentários, Transações, Alertas) | **SOMENTE INTERFACE** | Switches visuais operam no estado local do formulário sem efeito colateral. |
| Salvamento de Preferências de Notificação | **MOCK / SIMULAÇÃO** | Dispara `toast.success` sem enviar payload para nenhuma API ou comando Tauri. |

### 2.3 ABA 3 — Redes Sociais (`/user/account/socials`)
| Funcionalidade | Status | Detalhes Técnicos |
|---|---|---|
| Formulário de Links Profissionais (LinkedIn, X, Instagram, Facebook) | **IMPLEMENTADA E CONECTADA** | Validação estrita de HTTPS, allowlist de domínios, rejeição de credenciais embutidas e teto de 2.048 caracteres. |
| Persistência e Sincronização de Redes Sociais | **IMPLEMENTADA E CONECTADA** | Integrada via `AccountSocialsView` diretamente a `useAccountFacade.updateProfile`, persistida via `IdentityBridge.saveUserProfile` no SQLite cifrado do cofre nativo (`user_profiles.social_links`). |

### 2.4 ABA 4 — Segurança (`/user/account/change-password`)
| Funcionalidade | Status | Detalhes Técnicos |
|---|---|---|
| Validação de Senha Forte (NIST SP 800-63B) | **IMPLEMENTADA E CONECTADA** | Mínimo 15 caracteres escalares Unicode, teto de 128, rejeição de senha atual. |
| Alternador Independente de Visualização de Senha | **IMPLEMENTADA E CONECTADA** | Estados separados para senha atual, nova senha e confirmação com atributos de acessibilidade. |
| Alteração Efetiva de Senha da Conta | **IMPLEMENTADA PARCIALMENTE** | Contrato `onChangePassword` pronto e tipado; bloqueia submissão e alerta usuário quando sem backend (a rota não injeta handler e Rust não tem comando). |
| Pareamento Biométrico Nativo | **IMPLEMENTADA PARCIALMENTE** | Interface desacoplada aguardando handler `onConfigureBiometrics`; alerta de indisponibilidade ativo. |
| Gestão e Revogação de Sessões Remotas | **IMPLEMENTADA PARCIALMENTE** | Suporte a lista dinâmica de sessões e handler `onRevokeSession`; aguarda conexão a serviço. |

### 2.5 ABA 5 — Autenticador 2FA (`/user/account/2fa`)
| Funcionalidade | Status | Detalhes Técnicos |
|---|---|---|
| Habilitação / Visualização de TOTP 2FA | **MOCK / SIMULAÇÃO** | QR Code estático, chave secreta fixa (`JBSWY3DPEHPK3PXP`) e ausência de verificação RFC 6238. |
| Modo Restrito de Autenticação (Strict Auth) | **IMPLEMENTADA PARCIALMENTE** | Alternador persiste no store do perfil (`useAccountFacade`), mas não possui middleware de bloqueio no Rust. |
| Vínculo de Carteira Web3 EVM | **IMPLEMENTADA PARCIALMENTE** | Grava endereço público no perfil local, sem prova criptográfica de assinatura (EIP-712). |
| Vínculo de Conta Google SSO | **IMPLEMENTADA PARCIALMENTE** | Grava e-mail no perfil local, sem autenticação OAuth2 corporativa. |
| Vínculo de Conta GitHub Operador | **IMPLEMENTADA PARCIALMENTE** | Grava username no perfil local, sem validação de credencial GitHub. |

---

## 3. Resumo Quantitativo por Status

* **IMPLEMENTADA E CONECTADA:** 10 funcionalidades (100% da Aba 1, 100% da Aba 3, validações de senha da Aba 4).
* **IMPLEMENTADA PARCIALMENTE:** 6 funcionalidades (Aba 4 e Aba 5).
* **MOCK / SIMULAÇÃO:** 2 funcionalidades (Salvamento de Notificações na Aba 2 e Validação TOTP na Aba 5).
* **SOMENTE INTERFACE:** 2 funcionalidades (Canais e Eventos da Aba 2).
* **NÃO UTILIZADA:** 0 (todas as 5 abas estão mapeadas e acessíveis nas edições do produto).
* **NÃO VERIFICADA:** 0 (100% dos arquivos e dependências foram inspecionados).
