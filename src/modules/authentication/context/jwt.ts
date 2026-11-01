import { isTauriDesktop } from 'src/platform/tauri/core/invoke';
import { VaultBridge } from 'src/platform/tauri/vault/vault-bridge';

// ----------------------------------------------------------------------
// Contratos públicos
// ----------------------------------------------------------------------

/**
 * Parâmetros para autenticação por senha mestre.
 *
 * No Desktop, a senha é utilizada para desbloquear o cofre local.
 * O e-mail não é utilizado como credencial de desbloqueio nativa.
 */
export interface SignInParams {
  email?: string;
  password?: string;
}

/**
 * Parâmetros aceitos pelo fluxo de cadastro.
 *
 * No Desktop, esta implementação inicializa o cofre local.
 * Os dados de identidade não são persistidos por esta função.
 */
export interface SignUpParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// ----------------------------------------------------------------------
// Validação de entrada
// ----------------------------------------------------------------------

/**
 * Valida uma string sem modificar seu conteúdo.
 *
 * A senha nunca é normalizada com trim(), pois isso alteraria
 * o segredo enviado à implementação nativa.
 */
function assertNonEmptyPassword(
  password: unknown
): asserts password is string {
  if (
    typeof password !== 'string' ||
    password.length === 0
  ) {
    throw new Error('A senha mestre é obrigatória.');
  }
}

/**
 * Validação da senha no momento de inicializar o cofre.
 *
 * Mantém a política já utilizada pela interface de cadastro:
 * mínimo de 12 caracteres.
 *
 * Não modifica o valor da senha.
 */
function assertValidMasterPasswordForSetup(
  password: unknown
): asserts password is string {
  assertNonEmptyPassword(password);

  if (password.trim().length === 0) {
    throw new Error(
      'A senha mestre não pode conter somente espaços.'
    );
  }

  if (password.length < 12) {
    throw new Error(
      'A senha mestre deve ter pelo menos 12 caracteres.'
    );
  }
}

/**
 * Valida apenas se o e-mail foi informado.
 *
 * A validação completa do formato permanece no esquema Zod
 * da interface de autenticação.
 */
function assertNonEmptyEmail(
  email: unknown
): asserts email is string {
  if (
    typeof email !== 'string' ||
    email.trim().length === 0
  ) {
    throw new Error('O e-mail é obrigatório.');
  }
}

/**
 * Verifica o formato hexadecimal básico de um endereço EVM.
 *
 * Esta validação NÃO autentica a carteira e não comprova
 * posse da chave privada correspondente.
 */
function isValidEvmAddress(
  address: unknown
): address is string {
  return (
    typeof address === 'string' &&
    /^0x[a-fA-F0-9]{40}$/.test(address)
  );
}

// ----------------------------------------------------------------------
// Autenticação por senha mestre
// ----------------------------------------------------------------------

export async function signInWithPassword({
  email,
  password,
}: SignInParams): Promise<boolean> {
  assertNonEmptyPassword(password);

  // Desktop: a autenticação local é feita pelo cofre nativo.
  if (isTauriDesktop()) {
    const success = await VaultBridge.unlock(password);

    if (!success) {
      throw new Error('Senha mestre incorreta.');
    }

    return true;
  }

  // ------------------------------------------------------------
  // Web Preview
  // ------------------------------------------------------------
  //
  // Comportamento de demonstração preservado por compatibilidade.
  //
  // IMPORTANTE:
  // Este retorno não verifica uma identidade real.
  // Não deve ser utilizado como autorização para acessar
  // dados protegidos ou funcionalidades privilegiadas em produção.
  // ------------------------------------------------------------

  assertNonEmptyEmail(email);

  return true;
}

// ----------------------------------------------------------------------
// Autenticação Web3
// ----------------------------------------------------------------------

export async function signInWithWeb3(
  address: string
): Promise<boolean> {
  if (!isValidEvmAddress(address)) {
    throw new Error(
      'Endereço de carteira EVM inválido.'
    );
  }

  /**
   * Não existe, no código fornecido, uma implementação que:
   *
   * 1. Gere ou obtenha um desafio criptográfico.
   * 2. Verifique uma assinatura da carteira.
   * 3. Confirme a associação da carteira a uma identidade autorizada.
   * 4. Estabeleça uma sessão autenticada.
   *
   * A validação do formato do endereço não é suficiente para
   * conceder acesso. Por isso, a operação falha de maneira
   * explícita até que a integração de autenticação seja implementada.
   *
   * A assinatura pública é mantida para preservar a compatibilidade
   * com os consumidores existentes.
   */

  throw new Error(
    'Autenticação Web3 indisponível: é necessário verificar ' +
      'a assinatura criptográfica e o vínculo da carteira antes ' +
      'de autorizar o acesso.'
  );
}

// ----------------------------------------------------------------------
// Inicialização do cofre
// ----------------------------------------------------------------------

export async function signUp({
  email,
  password,
}: SignUpParams): Promise<boolean> {
  assertNonEmptyEmail(email);

  assertValidMasterPasswordForSetup(password);

  // ------------------------------------------------------------
  // Desktop: inicialização do cofre nativo
  // ------------------------------------------------------------

  if (isTauriDesktop()) {
    const initialized =
      await VaultBridge.initMasterPassword(password);

    if (!initialized) {
      throw new Error(
        'Falha ao inicializar a senha mestre do cofre.'
      );
    }

    // ----------------------------------------------------------
    // Desbloqueio imediato após a inicialização
    // ----------------------------------------------------------
    //
    // A inicialização e o desbloqueio são operações distintas.
    // O fluxo só retorna sucesso se ambas forem confirmadas.
    // ----------------------------------------------------------

    let unlocked: boolean;

    try {
      unlocked = await VaultBridge.unlock(password);
    } catch {
      throw new Error(
        'O cofre foi inicializado, mas não foi possível confirmar ' +
          'o desbloqueio. Acesse a tela de login e tente desbloquear ' +
          'o cofre com a senha mestre.'
      );
    }

    if (!unlocked) {
      throw new Error(
        'O cofre foi inicializado, mas permaneceu bloqueado. ' +
          'Acesse a tela de login e tente desbloquear o cofre ' +
          'com a senha mestre.'
      );
    }

    return true;
  }

  // ------------------------------------------------------------
  // Web Preview
  // ------------------------------------------------------------
  //
  // Simulação preservada para a experiência de demonstração.
  //
  // Este caminho não inicializa um cofre nativo e não persiste
  // uma conta institucional.
  // ------------------------------------------------------------

  return true;
}
