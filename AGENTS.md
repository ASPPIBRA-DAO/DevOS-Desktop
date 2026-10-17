# INSTRUÇÃO OPERACIONAL — RASTREABILIDADE E AUDITORIA DE ALTERAÇÕES NO GIT

PAPEL: AGENTE DE DESENVOLVIMENTO COM RASTREABILIDADE E AUDITORIA GIT

## 1. OBJETIVO
Garantir que todas as alterações realizadas no projeto sejam rastreáveis, auditáveis, individualizadas e reversíveis por meio do histórico do Git.

Permitir identificar a qualquer momento:
- Qual arquivo foi alterado.
- O que foi modificado no arquivo.
- Por que a alteração foi realizada.
- Qual foi o impacto da atualização.
- Quando a alteração foi registrada.
- Qual commit corresponde à atualização.
- Como consultar, comparar ou reverter uma alteração específica.

## 2. REGRA PRINCIPAL E INEGOCIÁVEL
Cada arquivo alterado deve ser registrado em um commit individual, com uma mensagem que descreva especificamente a atualização realizada naquele arquivo.

Não agrupe arquivos diferentes em um mesmo commit, salvo exceção expressamente autorizada e documentada.

## 3. PROCEDIMENTO OBRIGATÓRIO

1. **Analisar o estado do repositório antes de começar**:
   - Identifique a raiz do repositório Git (`git rev-parse --show-toplevel`).
   - Verifique a branch atual (`git branch --show-current`).
   - Inspecione alterações pendentes (`git status --short`).
   - Analise o histórico recente (`git log -10 --oneline`).
   - Identifique alterações preexistentes e não as misture com a tarefa atual.

2. **Examinar cada arquivo individualmente**:
   - Compare o conteúdo anterior e o atualizado (`git diff <arquivo>`).
   - Determine a finalidade, o impacto e possíveis efeitos colaterais.
   - Verifique se o arquivo contém segredos, credenciais, chaves privadas ou dados sensíveis. NUNCA registrar segredos no Git.

3. **Executar verificações antes do commit**:
   - Compilação estática (`tsc --noEmit`, `cargo check`).
   - Testes unitários pertinentes (`vitest run`, `cargo test`).

4. **Padrão de mensagens de commit**:
   - Formato obrigatório: `tipo(escopo): descrição objetiva da alteração`
   - Tipos permitidos: `feat`, `fix`, `refactor`, `docs`, `test`, `perf`, `build`, `ci`, `style`, `chore`, `revert`.
   - Mensagens devem ser específicas, objetivas e em português, mantendo identificadores técnicos originais.
   - PROIBIDO o uso de mensagens genéricas (`update`, `changes`, `fixes`, `ajustes`).

5. **Staging e commit individual**:
   - Utilize exclusivamente: `git add -- <caminho/do/arquivo>`.
   - Revise antes de confirmar: `git diff --cached`.
   - NUNCA utilizar `git add .`, `git add -A` ou `git commit -am`.

6. **Validação pós-commit**:
   - Confirme o hash gerado: `git log -1 --format="%h %H %an %aI %s"`.
   - Inspecione a alteração registrada: `git show --stat --oneline HEAD`.
   - Garanta que apenas o arquivo planejado foi incluído.

7. **Registro Estruturado de Auditoria**:
   - Manter e atualizar o arquivo `audit/git-change-log.csv` com as colunas:
     `timestamp_utc,task_id,commit_hash,parent_hash,branch,file_path,change_type,commit_type,commit_message,change_summary,validation_status,author,notes`
   - O arquivo de auditoria é atualizado em commit individual próprio após o registro dos arquivos de código.

8. **Proteção de Dados e Integridade do Histórico**:
   - PROIBIDO executar comandos destrutivos sem autorização: `git reset --hard`, `git clean -fd`, `git restore .`, `git push --force`.
   - Não reescrever histórico existente.

9. **Relatório Final Obrigatório**:
   - Ao concluir a tarefa, emitir relatório detalhado com: resumo de execução, tabela do histórico individual de commits, lista explícita de pendências e situação final do repositório.
