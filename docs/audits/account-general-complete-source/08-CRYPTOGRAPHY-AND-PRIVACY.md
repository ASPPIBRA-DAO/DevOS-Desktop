# CRIPTOGRAFIA, DADOS PESSOAIS E PRIVACIDADE LGPD — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. MECANISMOS CRIPTOGRÁFICOS DO COFRE (`devos_vault.sqlite`)

A proteção dos dados civis e empresariais da ABA 1 é implementada no módulo `src-tauri/src/modules/vault/`:

1. **Cifragem Autenticada:** Algoritmo **AES-256-GCM** (Galois/Counter Mode).
2. **Autenticidade e Integridade:** O GCM gera uma tag de autenticação de 128 bits garantindo que qualquer manipulação externa no arquivo SQLite corrompa a validação e impeça leitura de dados forjados.
3. **Nonce / IV Seguro:** Cada gravação de perfil gera um Nonce criptográfico único de 96 bits via gerador seguro de números pseudoaleatórios (`OsRng`). Reutilização de nonce é matematicamente impossível.
4. **Isolamento de Chaves:** A chave mestre do cofre é derivada da senha do operador através de KDF Argon2id e permanece exclusivamente em memória volátil durante a sessão ativa, sendo limpa após timeout ou bloqueio manual.

---

## 2. PRIVACIDADE POR DESIGN E CONFORMIDADE COM A LGPD

A ABA 1 lida com dados altamente sensíveis segundo a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018):
- CPF, RG, CNH, Data de Nascimento, Filiação materna e paterna.
- Endereço residencial completo.
- Dados de representação corporativa.

### A. Princípio da Minimização e Local-First Custody
Nenhum dado pessoal é transmitido para servidores remotos na internet ou mantido em bancos de dados compartilhados em nuvem. Toda a persistência é local no dispositivo do operador, garantindo soberania total sobre as credenciais.

### B. Projeção Pública Restrita (`PublicUserProfileDto`)
O modelo Rust implementa uma **allowlist estrita** de atributos públicos (`to_public_projection()`):
- **Campos permitidos caso `isPublic == true`:** `displayName`, `username`, `occupation`, `company`, `website`, `about`, `photoUrl`, `coverUrl`, `socialLinks`.
- **Campos terminantemente bloqueados:** CPF, RG, Órgão Emissor, CNH, Categoria CNH, Data de Nascimento, Filiação (Mãe e Pai), Endereço Residencial, Número, Bairro, CEP, CNPJ e CPF do Representante Legal.
- **Fail-Closed:** Se `isPublic == false`, a função retorna `None`, garantindo que nenhuma projeção seja exposta externamente.
