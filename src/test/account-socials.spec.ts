import { it, expect, describe } from 'vitest';

import {
  ALLOWED_HOSTS,
  MAX_URL_LENGTH,
  createDefaultValues,
  normalizeSocialLinks,
} from 'src/sections/account/account-socials';

describe('AccountSocials — Validação e Normalização de Presença Digital', () => {
  it('deve aceitar URLs válidas de cada plataforma correspondente com HTTPS', () => {
    const valid = {
      linkedin: 'https://www.linkedin.com/in/sandro-dev',
      twitter: 'https://x.com/sandro_dev',
      instagram: 'https://instagram.com/sandro.dev',
      facebook: 'https://www.facebook.com/sandro.asppibra',
    };

    const { values, errors } = normalizeSocialLinks(valid);
    expect(errors).toEqual({});
    expect(values.linkedin).toBe('https://www.linkedin.com/in/sandro-dev');
    expect(values.twitter).toBe('https://x.com/sandro_dev');
    expect(values.instagram).toBe('https://instagram.com/sandro.dev');
    expect(values.facebook).toBe('https://www.facebook.com/sandro.asppibra');
  });

  it('deve permitir campos vazios como padrão opcional sem injetar dados institucionais', () => {
    const emptyDefaults = createDefaultValues();
    expect(emptyDefaults).toEqual({
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
    });

    const { values, errors } = normalizeSocialLinks(emptyDefaults);
    expect(errors).toEqual({});
    expect(values).toEqual({
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
    });
  });

  it('deve rejeitar URLs sem protocolo HTTPS (como HTTP puro ou javascript:)', () => {
    const insecure = {
      linkedin: 'http://www.linkedin.com/in/sandro',
      twitter: 'javascript:alert(1)',
    };

    const { errors } = normalizeSocialLinks(insecure);
    expect(errors.linkedin).toContain('HTTPS');
    expect(errors.twitter).toContain('HTTPS');
  });

  it('deve rejeitar domínios cruzados ou falsos (phishing / spoofing)', () => {
    const spoofed = {
      linkedin: 'https://linkedin.com.site-malicioso.com/in/user',
      instagram: 'https://www.linkedin.com/in/user', // Plataforma errada
      facebook: 'https://google.com',
    };

    const { errors } = normalizeSocialLinks(spoofed);
    expect(errors.linkedin).toContain('plataforma correspondente');
    expect(errors.instagram).toContain('plataforma correspondente');
    expect(errors.facebook).toContain('plataforma correspondente');
  });

  it('deve rejeitar URLs com credenciais embutidas ou portas não convencionais', () => {
    const dangerous = {
      linkedin: 'https://admin:secret@www.linkedin.com/in/user',
      twitter: 'https://x.com:8080/user',
    };

    const { errors } = normalizeSocialLinks(dangerous);
    expect(errors.linkedin).toContain('HTTPS válida');
    expect(errors.twitter).toContain('HTTPS válida');
  });

  it('deve rejeitar URLs com tamanho maior que 2.048 caracteres', () => {
    const oversized = {
      linkedin: `https://www.linkedin.com/in/${'a'.repeat(MAX_URL_LENGTH)}`,
    };

    const { errors } = normalizeSocialLinks(oversized);
    expect(errors.linkedin).toContain('ultrapassa o tamanho permitido');
  });

  it('deve rejeitar valores que não sejam strings em tempo de execução', () => {
    const invalidTypes = {
      linkedin: 123456 as any,
      twitter: { url: 'https://x.com/sandro' } as any,
      facebook: true as any,
    };

    const { errors } = normalizeSocialLinks(invalidTypes);
    expect(errors.linkedin).toContain('texto válido');
    expect(errors.twitter).toContain('texto válido');
    expect(errors.facebook).toContain('texto válido');
  });

  it('deve normalizar espaços ao redor da URL', () => {
    const padded = {
      linkedin: '   https://www.linkedin.com/in/sandro-dev   ',
    };

    const { values, errors } = normalizeSocialLinks(padded);
    expect(errors).toEqual({});
    expect(values.linkedin).toBe('https://www.linkedin.com/in/sandro-dev');
  });

  it('ALLOWED_HOSTS deve conter domínios legítimos de cada plataforma', () => {
    expect(ALLOWED_HOSTS.linkedin).toContain('linkedin.com');
    expect(ALLOWED_HOSTS.twitter).toContain('x.com');
    expect(ALLOWED_HOSTS.twitter).toContain('twitter.com');
    expect(ALLOWED_HOSTS.instagram).toContain('instagram.com');
    expect(ALLOWED_HOSTS.facebook).toContain('facebook.com');
  });
});
