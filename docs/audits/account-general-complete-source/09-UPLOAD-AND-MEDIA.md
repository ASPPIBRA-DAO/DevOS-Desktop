# DIAGNÓSTICO DE UPLOAD E MÍDIA — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. INVESTIGAÇÃO DOS CAMPOS `photoURL` E `coverURL`

A auditoria rastreou a manipulação de imagens na aplicação:

1. **Definição em Contratos:** Os campos `photoURL` e `coverURL` existem em:
   - `UserAccountData` (`use-account.ts`)
   - `UserProfileDto` (`models.rs`)
   - `SaveUserProfilePayload` (`identity-contracts.ts`)
   - Schema Zod `UpdateUserSchema` (`account-general.tsx`)

2. **Ausência de Componente de Upload em `AccountGeneral`:**
   - No componente principal de formulário `src/sections/account/account-general.tsx`, **não existe campo de input file ou componente de upload de foto renderizado**.
   - O formulário concentra-se na qualificação civil e documental em texto.

3. **Renderização de Upload em `UserProfileView`:**
   - Na rota alternativa `/user/profile` (`src/sections/user/view/user-profile-view.tsx`), o componente `ProfileCover` apresenta botões com ícones de câmera para avatar e capa.
   - O handler implementado é:
     ```typescript
     const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       const file = event.target.files?.[0];
       if (file) {
         const url = URL.createObjectURL(file);
         onUpdateAvatar?.(url);
         toast.success('Foto de perfil atualizada!');
       }
     };
     ```

---

## 2. DIAGNÓSTICO DO PROBLEMA DE PERSISTÊNCIA DE MÍDIA (RISCO ALTO)

### O Problema da URL Volátil (`blob:http://...`)
A implementação utiliza `URL.createObjectURL(file)`, que cria uma URI interna na memória do navegador.

- **Consequência:** A string salva no cofre criptográfico é algo como `blob:http://localhost:5173/3f98c21a-...`.
- **Efeito Imediato:** Funciona perfeitamente na tela aberta enquanto a página não for recarregada.
- **Falha Crítica ao Fechar o App:** Assim que a aplicação fecha ou é reinicializada, a referência de memória do blob é destruída pelo Chromium/WebKit. Ao reabrir o DevOS, o cofre recupera a string `blob:...` inválida, resultando em **imagem quebrada (404/ERR_FILE_NOT_FOUND)**.

---

## 3. SOLUÇÃO ARQUITETURAL RECOMENDADA PARA PRODUÇÃO

Para que a foto e a capa persistam de forma definitiva no DevOS Desktop, deve ser adotada uma das duas abordagens:

1. **Armazenamento Nativo em Diretório de Dados (Recomendado):**
   - Criar comando Tauri `save_profile_media` que recebe os bytes da imagem.
   - O backend valida MIME type real (JPEG, PNG, WebP) via magic bytes (bloqueia executáveis e SVG com scripts).
   - Redimensiona e grava no diretório `app_data_dir/media/avatars/`.
   - Persiste no cofre o caminho absoluto local seguro ou caminho canônico `devos://media/avatar.png`.

2. **Cifragem em Base64 / SQLite BLOB:**
   - Converter para Base64 (com teto estrito de 2 MB) ou salvar como BLOB cifrado diretamente na tabela de perfil.
