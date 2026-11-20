# FORMULÁRIOS E REGRAS DE VALIDAÇÃO — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. SCHEMA ZOD E TIPOS TYPESCRIPT

O formulário de Perfil Geral é governado pelo schema Zod `UpdateUserSchema` definido em `src/sections/account/account-general.tsx`.

```typescript
export const UpdateUserSchema = z
  .object({
    personType: z.enum(['PF', 'PJ']),
    firstName: z.string().trim().max(100, 'Máximo de 100 caracteres'),
    lastName: z.string().trim().max(100, 'Máximo de 100 caracteres'),
    companyName: z.string().trim().max(150, 'Máximo de 150 caracteres'),
    cnpj: z.string().trim().max(20, 'Máximo de 20 caracteres'),
    legalRepresentative: z.string().trim().max(100, 'Máximo de 100 caracteres'),
    legalRepresentativeCpf: z.string().trim().max(20, 'Máximo de 20 caracteres'),
    username: z
      .string()
      .trim()
      .min(3, { message: 'Username deve ter pelo menos 3 caracteres' })
      .max(30, { message: 'Username deve ter no máximo 30 caracteres' })
      .regex(/^[a-z0-9_]+$/, {
        message: 'Apenas letras minúsculas, números e sublinhados são permitidos',
      }),
    email: z.string().trim().email({ message: 'E-mail inválido!' }),
    photoURL: z.string().nullable().optional(),
    coverURL: z.string().nullable().optional(),
    phoneNumber: z.string().trim().max(30, 'Telefone inválido'),
    cpf: z.string().trim().max(20, 'CPF inválido'),
    birthDate: z.string().trim(),
    nationality: z.string().trim().max(50),
    maritalStatus: z.string().trim(),
    rg: z.string().trim().max(30),
    rgIssuer: z.string().trim().max(30),
    cnh: z.string().trim().max(30),
    cnhCategory: z.string().trim().max(10),
    motherName: z.string().trim().max(100),
    fatherName: z.string().trim().max(100),
    country: z.string().trim().min(1, { message: 'País obrigatório!' }),
    address: z.string().trim().min(1, { message: 'Endereço obrigatório!' }),
    addressNumber: z.string().trim().max(30),
    complement: z.string().trim().max(100),
    neighborhood: z.string().trim().max(100),
    state: z.string().trim().min(1, { message: 'Estado obrigatório!' }),
    city: z.string().trim().min(1, { message: 'Cidade obrigatória!' }),
    zipCode: z.string().trim().min(1, { message: 'CEP obrigatório!' }),
    occupation: z.string().trim().max(100),
    company: z.string().trim().max(100),
    website: z.string().trim().max(200),
    about: z.string().trim().max(2000, 'Máximo de 2.000 caracteres'),
    isPublic: z.boolean(),
  })
  .superRefine((data, ctx) => { /* Regras de refinamento condicional */ });
```

---

## 2. VALIDADORES DOCUMENTAIS E REGRAS ESTRITAS

O arquivo implementa funções puras de validação rigorosa com compatibilidade plena entre frontend TypeScript e backend Rust:

### A. Validação de CPF (`isStrictValidCpf`)
- **Regra:** Aceita exatamente 11 dígitos puros (`/^\d{11}$/`) ou formato com máscara oficial `000.000.000-00` (`/^\d{3}\.\d{3}\.\d{3}-\d{2}$/`).
- **Rejeição de Sequências:** Bloqueia números com todos os dígitos idênticos (`111.111.111-11`, etc.).
- **Dígitos Verificadores:** Executa o algoritmo oficial Módulo 11 da Receita Federal para os dois dígitos finais.
- **Fail-Closed:** Retorna `false` para strings vazias, nulas ou formatos corrompidos.

### B. Validação de CNPJ (`isStrictValidCnpj`)
- **Suporte Duplo Oficial:** Suporta tanto o formato numérico clássico (14 dígitos) quanto o novo **formato alfanumérico** regulamentado pela **Instrução Normativa RFB nº 2.229/2024** para o padrão 2026.
- **Formato Aceito:** 14 caracteres alfanuméricos puros `^[A-Z0-9]{12}\d{2}$` ou com máscara `^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$`.
- **Cálculo de Dígitos:** Converte caracteres ASCII subtraindo 48 e aplica os pesos oficiais `[5,4,3,2,9,8,7,6,5,4,3,2]` e `[6,5,4,3,2,9,8,7,6,5,4,3,2]`.

### C. Validação de Data de Nascimento (`isStrictValidBirthDate`)
- **Formatos:** Aceita ISO (`AAAA-MM-DD`) ou formato brasileiro (`DD/MM/AAAA`).
- **Calendário Gregoriano Real:** Rejeita datas inexistentes, como 29 de fevereiro em anos não bissextos (ex: `2023-02-29`), meses > 12 e dias > 31.
- **Datas Futuras:** Compara com `new Date()` e rejeita qualquer data superior ao momento atual.
- **Ano Mínimo:** Exige ano >= 1900.

### D. Validação de CEP (`isStrictValidCep`)
- **Formato:** Exige exatamente 8 dígitos numéricos, puro (`01310100`) ou com hífen (`01310-100`).

### E. Validação de Telefone (`isStrictValidPhone`)
- **Regra:** Exige de 10 a 13 dígitos numéricos (com DDD). Rejeita caracteres alfabéticos.

### F. Validação de Website (`isStrictValidWebsite`)
- **Construtor Nativo:** Instancia `new URL(trimmed)` para conformidade RFC.
- **Protocolo:** Exige estritamente `http:` ou `https:`.
- **Credenciais Embutidas:** Rejeita explicitamente URLs contendo `username` ou `password` embutidos (`https://user:pass@host`).
- **FQDN:** Exige hostname válido contendo ponto (`.`) e sem ponto no final.

---

## 3. CÁLCULO DETERMINÍSTICO DE COMPLETUDE (100 PONTOS)

A função `calculateIdentityCompleteness` é calibrada com pesos exatos para atingir exatamente 100 pontos em ambos os regimes de titularidade:

| Categoria | Campo Validado | Pontuação PF | Pontuação PJ |
|---|---|:---:|:---:|
| **Titularidade** | Nome e Sobrenome / Razão Social | 20 pts | 20 pts |
| **Documento Mestre** | CPF / CNPJ Válido | 20 pts | 20 pts |
| **Representante Legal** | Nome do Representante | — | 15 pts |
| **Documento Rep.** | CPF do Representante Válido | — | 10 pts |
| **Documento Secundário** | RG ou CNH preenchidos | 10 pts | — |
| **Data Civil** | Nascimento Válido | 10 pts | — |
| **Filiação** | Nome da Mãe | 5 pts | — |
| **Contato** | Email válido com `@` | 10 pts | 10 pts |
| **Telefone** | Telefone com DDD válido | 5 pts | 5 pts |
| **Localização** | CEP Válido | 5 pts | 5 pts |
| **Município** | Cidade e Estado preenchidos | 5 pts | 5 pts |
| **Logradouro** | Endereço residencial / comercial | 5 pts | 5 pts |
| **Atuação** | Ocupação / Biografia / CNAE | 5 pts | 5 pts |
| **TOTAL MÁXIMO** | **Soma Exata** | **100 pts** | **100 pts** |

---

## 4. PRESERVAÇÃO DE CAMPOS NA ALTERNÂNCIA PF <-> PJ

Quando o usuário alterna o formulário entre "Pessoa Física" e "Pessoa Jurídica":
- O estado reativo **NÃO apaga** os campos do regime oposto.
- A função `accountDataToSavePayload` e o backend Rust preservam os valores inativos no cofre SQLite.
- Isso impede que a troca acidental de um dropdown apague documentos civis ou dados de CNPJ previamente validados.
