/**
 * Utilitários auxiliares de tempo para a página de visão geral comunitária.
 */

export function fAdd(duration: { days?: number; hours?: number; minutes?: number }): string {
  const now = new Date();
  if (duration.days) now.setDate(now.getDate() + duration.days);
  if (duration.hours) now.setHours(now.getHours() + duration.hours);
  if (duration.minutes) now.setMinutes(now.getMinutes() + duration.minutes);
  return now.toISOString();
}

export function fSub(duration: { days?: number; hours?: number; minutes?: number }): string {
  const now = new Date();
  if (duration.days) now.setDate(now.getDate() - duration.days);
  if (duration.hours) now.setHours(now.getHours() - duration.hours);
  if (duration.minutes) now.setMinutes(now.getMinutes() - duration.minutes);
  return now.toISOString();
}

export function fToNow(date: string | number | Date): string {
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return '';

  const diffMs = target - Date.now();
  const isPast = diffMs < 0;
  const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);

  if (absDiffSec < 60) return isPast ? 'há poucos segundos' : 'em instantes';
  const mins = Math.floor(absDiffSec / 60);
  if (mins < 60) return isPast ? `há ${mins} min` : `em ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isPast ? `há ${hours} h` : `em ${hours} h`;
  const days = Math.floor(hours / 24);
  return isPast ? `há ${days} d` : `em ${days} d`;
}

