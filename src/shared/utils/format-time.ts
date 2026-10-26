import dayjs from 'dayjs';

/**
 * Utilitário de formatação de data e tempo fiduciário com dayjs
 */
export function fDate(date: string | number | Date | null | undefined, format = 'DD/MM/YYYY'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

export function fDateTime(date: string | number | Date | null | undefined, format = 'DD/MM/YYYY HH:mm:ss'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}
