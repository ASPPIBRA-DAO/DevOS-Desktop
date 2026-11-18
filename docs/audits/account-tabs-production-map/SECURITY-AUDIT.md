# 07 — Auditoria de Segurança da Informação e AppSec

## 1. Classificação Geral de Riscos

Esta auditoria de segurança avaliou as 5 abas da seção Conta quanto aos padrões OWASP ASVS 4.0, NIST SP 800-63B e diretrizes de desenvolvimento seguro para o runtime Tauri v2.

---

## 2. Matriz Consolidada de Vulnerabilidades e Riscos

| ID | Gravidade | Aba | Arquivo e Linhas | Descrição do Risco | Impacto Potencial | Correção Recomendada | Dependências Envolvidas |
|---|---|---|---|---|---|---|---|
| **SEC-01** | **CRÍTICA (P0)** | Aba 5 (2FA) | `src/sections/account/account-2fa.tsx:529` | **Chave Secreta TOTP Estática Hardcoded** (`JBSWY3DPEHPK3PXP`) e QR Code fictício estático. | Qualquer invasor que examine o código-fonte ou inspecione a tela pode gerar os mesmos códigos TOTP em qualquer app autenticador. | Gerar segredos criptográficos por usuário no backend Rust com `rand::rngs::OsRng`, codificar em Base32 e renderizar QR Code dinâmico via SVG/Canvas. | React, Tauri IPC, Rust (`rand`, `base32`) |
| **SEC-02** | **CRÍTICA (P0)** | Aba 5 (2FA) | `src/sections/account/account-2fa.tsx:57-61` | **Validação TOTP Cega (Bypass Completo de 2FA)**: Aceita qualquer sequência de 6 dígitos numéricos (`totpCode.length === 6`) sem validação RFC 6238. | Um invasor pode digitar `000000` ou `123456` e o sistema considera o segundo fator de autenticação validado com sucesso. | Implementar algoritmo RFC 6238 (HMAC-SHA1 com time-step de 30s) no backend Rust com janela de tolerância de ±1 passo temporal. | React Hook Form, Tauri IPC, Rust (`sha1`, `hmac`) |
| **SEC-03** | **ALTA (P1)** | Aba 5 (2FA) | `src/sections/account/account-2fa.tsx:99-138` | **Vínculo de Carteiras e Provedores sem Prova Criptográfica**: Carteiras Web3 são vinculadas com base apenas em checagem de string `0x...`, sem validação de assinatura EIP-712. Contas Google e GitHub são aceitas sem fluxo OAuth. | Um invasor pode cadastrar o endereço da carteira de outra pessoa e usufruir de permissões atribuídas no nó caso o Modo Restrito esteja ativo. | Exigir desafio de assinatura digital (nonce assinado pela chave privada da carteira externa via MetaMask/WalletConnect) antes de persistir o vínculo, e implementar OAuth2 PKCE para Google/GitHub. | Web3 provider, EIP-712, OAuth2 PKCE |
| **SEC-04** | **ALTA (P1)** | Aba 2 (Notificações) | `src/sections/account/account-notifications.tsx:50-53` | **Falsa Sensação de Segurança em Notificações**: Opções de "Alertas de Segurança da Conta" e "Transações Financeiras" não persistem dados nem acionam backend. | O usuário acredita que receberá alertas críticos de segurança por e-mail/SMS, mas o sistema não despachará notificações em caso de invasão. | Implementar tabela de preferências no SQLite ou API central e integrar aos daemons de alerta. | SQLite, Tauri IPC, Notification Daemon |
| **SEC-05** | **MÉDIA (P2)** | Aba 1 (Identidade) | `src/sections/account/use-account.ts:138-180` | **Exposição Transitória de Dados Pessoais no localStorage**: Dados cadastrais legados permanecem em texto puro no `localStorage` até que a rotina de migração seja disparada. | Se o navegador/webview for inspecionado ou sofrer XSS antes da migração, PII (CPF, RG, e-mail) pode ser extraído. | A rotina `removeLegacyProfile()` remove a chave após a primeira sincronização bem-sucedida, mas o cofre deve desabilitar o fallback para localStorage em produção. | `localStorage`, `useAccountFacade` |
| **SEC-06** | **MÉDIA (P2)** | Aba 4 (Segurança) | `src/pages/user/account/change-password.tsx:5-9` e `src-tauri/src/commands/vault_commands.rs` | **Desconexão de Troca de Senha e Falta de Comando Rust**: A página não injeta o handler `onChangePassword`, desabilitando o botão de envio; ademais, o backend nativo Rust não possui comando exposto para alteração da senha mestre do cofre. | O usuário não consegue atualizar sua senha institucional ou senha do cofre a partir da interface. | Injetar o handler de reautenticação em `AccountChangePasswordPage` e implementar o comando nativo `change_master_password` no Rust com recifragem dos segredos. | React, React Router, Rust (`vault_commands`) |
| **SEC-07** | **BAIXA (P3)** | Aba 4 (Segurança) | `src/modules/authentication/application/identity-session.service.ts:18-30` | **Métodos Simulados de Recuperação de Senha**: `forgotPassword` e `resetPassword` retornam `true` se os campos estiverem preenchidos sem contatar o servidor. | Pode mascarar falhas de comunicação em rotas de redefinição de acesso. | Lançar erro explícito ou conectar ao servidor de autenticação antes de liberar a funcionalidade. | `IdentitySessionService`, Auth Backend |

---

## 3. Avaliação de Pontos Fortes de Segurança (Homologados)

1. **Criptografia Zero-Knowledge no SQLite Nativo:**
   - O arquivo [src-tauri/src/modules/identity/service.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/modules/identity/service.rs) cifra integralmente os dados de qualificação civil com **AES-256-GCM** antes de qualquer escrita no disco.
   - A chave do cofre é protegida com **Argon2id** (64 MB de memória, 3 iterações) e zeroizada da memória com o crate `zeroize`.
2. **Proteção Rigorosa de LGPD / PII em Logs:**
   - Comprovado em `src-tauri/src/modules/identity/service.rs:113-116`: O sistema nunca registra em logs de auditoria dados pessoais sensíveis (CPF, RG, nome completo, filiação), emitindo apenas IDs anônimos e status operacionais.
3. **Validação Estrita de Documentos Civis:**
   - Validadores matemáticos completos no Rust e no frontend para CPF e CNPJ (incluindo o novo padrão alfanumérico da RFB para 2026).
4. **Proteção contra Falsos Sucessos:**
   - A Aba 3 (Redes Sociais) e a Aba 4 (Segurança) agora rejeitam submissões e exibem alertas quando os serviços não estão conectados, eliminando a antiga falsa confirmação de sucesso.
5. **Mitigação Estrita contra Injeção de URLs:**
   - As redes sociais na Aba 3 exigem protocolo `https:`, rejeitam portas customizadas, bloqueiam credenciais embutidas (`user:pass@host`) e limitam o comprimento a 2.048 bytes, tanto no frontend (`normalizeSocialLinks`) quanto no backend Rust (`sanitize_social_url`).
