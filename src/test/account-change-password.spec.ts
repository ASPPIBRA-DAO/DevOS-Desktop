import { it, expect, describe } from 'vitest';

import {
  countCharacters,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  ChangePasswordSchema,
} from '../sections/account/account-change-password';

describe('AccountChangePassword — Validação e Política de Segurança NIST SP 800-63B', () => {
  it('deve calcular corretamente a quantidade de caracteres escalares Unicode', () => {
    expect(countCharacters('senhaSimples123')).toBe(15);
    expect(countCharacters('frase com espaço')).toBe(16);
    // Emojis e acentuação
    expect(countCharacters('segurança🔐2026!')).toBe(15);
  });

  it('deve rejeitar quando a senha atual estiver vazia', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'MinhaSenhaSeguraCom15Chars!',
      confirmNewPassword: 'MinhaSenhaSeguraCom15Chars!',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path[0] === 'currentPassword')).toBe(true);
    }
  });

  it('deve rejeitar nova senha com menos de 15 caracteres', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'SenhaAtualValida123!',
      newPassword: 'Curta12345678', // 13 chars
      confirmNewPassword: 'Curta12345678',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const pwdIssue = issues.find((i) => i.path[0] === 'newPassword');
      expect(pwdIssue).toBeDefined();
      expect(pwdIssue?.message).toContain(`pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }
  });

  it('deve rejeitar nova senha que ultrapasse 128 caracteres', () => {
    const oversized = 'a'.repeat(MAX_PASSWORD_LENGTH + 1);
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'SenhaAtualValida123!',
      newPassword: oversized,
      confirmNewPassword: oversized,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const pwdIssue = issues.find((i) => i.path[0] === 'newPassword');
      expect(pwdIssue).toBeDefined();
      expect(pwdIssue?.message).toContain(`não pode ultrapassar ${MAX_PASSWORD_LENGTH} caracteres`);
    }
  });

  it('deve aceitar nova senha válida de 15 caracteres ou mais', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'SenhaAtualValida123!',
      newPassword: 'NovaFraseSenhaCom15!',
      confirmNewPassword: 'NovaFraseSenhaCom15!',
    });

    expect(result.success).toBe(true);
  });

  it('deve aceitar senhas longas com 64 e 128 caracteres contendo espaços e símbolos', () => {
    const pwd64 = 'Esta e uma frase-senha extremamente segura recomendada pelo NIST64!';
    const result64 = ChangePasswordSchema.safeParse({
      currentPassword: 'SenhaAtualValida123!',
      newPassword: pwd64,
      confirmNewPassword: pwd64,
    });
    expect(result64.success).toBe(true);

    const pwd128 = 'a'.repeat(128);
    const result128 = ChangePasswordSchema.safeParse({
      currentPassword: 'SenhaAtualValida123!',
      newPassword: pwd128,
      confirmNewPassword: pwd128,
    });
    expect(result128.success).toBe(true);
  });

  it('deve permitir espaços internos e caracteres Unicode', () => {
    const unicodePwd = 'Frase de Acesso Institucional com Proteção 🛡️ 2026';
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'SenhaAtualValida123!',
      newPassword: unicodePwd,
      confirmNewPassword: unicodePwd,
    });

    expect(result.success).toBe(true);
  });

  it('deve rejeitar quando a nova senha for idêntica à senha atual', () => {
    const samePwd = 'MesmaSenhaUtilizadaAnteriormente123!';
    const result = ChangePasswordSchema.safeParse({
      currentPassword: samePwd,
      newPassword: samePwd,
      confirmNewPassword: samePwd,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'newPassword');
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('deve ser diferente da senha atual');
    }
  });

  it('deve rejeitar quando a confirmação de senha não coincidir', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'SenhaAtualValida123!',
      newPassword: 'NovaSenhaUltraSegura15!',
      confirmNewPassword: 'OutraSenhaNaoCoincidente15!',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'confirmNewPassword');
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('não coincidem');
    }
  });
});
