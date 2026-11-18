# 10 — Matriz Consolidada de Prontidão para Produção

## 1. Matriz de Prontidão por Aba

| Aba | Frontend | Backend | Persistência | Segurança | Testes | Veredito de Produção |
|---|---|---|---|---|---|---|
| **Aba 1: Perfil Geral** | **APROVADA** | **APROVADA** | **APROVADA** | **APROVADA** | **APROVADA** | **APROVADA PARA PRODUÇÃO** |
| **Aba 2: Notificações** | APROVADA COM RESSALVAS | **REPROVADA** | **REPROVADA** | **REPROVADA** | **PENDENTE** | **REPROVADA (Mock sem persistência)** |
| **Aba 3: Redes Sociais** | **APROVADA** | **APROVADA** | **APROVADA** | **APROVADA** | **APROVADA** | **APROVADA PARA PRODUÇÃO** |
| **Aba 4: Segurança** | **APROVADA** | **PENDENTE** | **PENDENTE** | **APROVADA** | **APROVADA** | **APROVADA COM RESSALVAS (Desconectada na página e sem comando Rust)** |
| **Aba 5: Autenticador 2FA** | APROVADA COM RESSALVAS | **REPROVADA** | PENDENTE | **REPROVADA** | **PENDENTE** | **REPROVADA (Vulnerabilidades P0 de TOTP estático)** |

---

## 2. Bloqueadores Críticos de Produção (P0 e P1)

### 2.1 Bloqueadores P0 (Impedimento Absoluto para Produção)
1. **[SEC-01 / Aba 5] Chave Secreta TOTP Estática:**
   - O segredo `JBSWY3DPEHPK3PXP` fixo no código de 2FA (`src/sections/account/account-2fa.tsx:529`) invalida completamente o fator de autenticação e expõe as contas dos usuários.
2. **[SEC-02 / Aba 5] Validação TOTP Cega (Bypass de Autenticação):**
   - A aceitação de qualquer código numérico de 6 dígitos sem algoritmo RFC 6238 (`src/sections/account/account-2fa.tsx:57-61`) constitui uma falha de autenticação bypassável trivialmente.

### 2.2 Bloqueadores P1 (Alto Risco Operacional / Integridade)
1. **[SEC-03 / Aba 5] Ausência de Assinatura Criptográfica em Carteiras Web3 e OAuth:**
   - Vínculo de carteiras EVM sem assinatura de desafio EIP-712 e contas Google/GitHub sem OAuth PKCE permite usurpação de autorização de nós.
2. **[SEC-04 / Aba 2] Notificações Críticas Fictícias:**
   - O usuário pode configurar alertas de segurança de conta que nunca serão disparados, deixando incidentes de invasão sem notificação.
3. **[SEC-06 / Aba 4] Desconexão de Troca de Senha e Falta de Comando Rust:**
   - A página `AccountChangePasswordPage` não passa handlers para a view, e o backend nativo Rust não possui o comando `change_master_password`, impedindo a redefinição de senhas pelo usuário.

---

## 3. Plano de Ação para Homologação Final de Produção

### Fase 1: Eliminação Imediata de Bloqueadores P0 (Aba 5)
1. Criar comando Tauri em Rust `generate_totp_secret` gerando segredo dinâmico criptograficamente seguro via `rand::rngs::OsRng`.
2. Criar comando Tauri em Rust `verify_totp_code(secret, code)` implementando RFC 6238 com verificação de timestamp Unix.
3. Renderizar QR Code dinâmico em SVG ou Canvas via biblioteca segura, eliminando o ícone estático.

### Fase 2: Implementação da Persistência de Notificações (Aba 2)
1. Adicionar migração 3 no SQLite (`notification_preferences`).
2. Criar comandos Tauri `get_notification_preferences` e `save_notification_preferences`.
3. Conectar o componente `AccountNotifications` a um bridge nativo `NotificationBridge`.

### Fase 3: Conexão da Aba 4 aos Serviços Reais
1. Implementar o comando Rust `change_master_password(old_pass, new_pass)` recifrando o `canary_envelope` e os `vault_secrets`.
2. Injetar o handler `onChangePassword` em `AccountChangePasswordPage`.

### Fase 4: Auditoria de Regressão e Assinatura de Release
1. Reexecutar a suíte completa de testes no Vitest e Cargo Test.
2. Gerar build final da edição Node (`pnpm build:node`) e Cockpit (`pnpm build:cockpit`).
