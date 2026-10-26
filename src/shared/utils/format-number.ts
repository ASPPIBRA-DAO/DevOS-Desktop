export function formatAsppbr(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00 ASPPBR';
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)} ASPPBR`;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const fData = formatBytes;

export function fCurrency(inputValue: number | string | null | undefined): string {
  if (inputValue === null || inputValue === undefined || isNaN(Number(inputValue))) return 'R$ 0,00';
  const num = Number(inputValue);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function fNumber(
  inputValue: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (inputValue === null || inputValue === undefined || isNaN(Number(inputValue))) return '0';
  const num = Number(inputValue);
  return new Intl.NumberFormat('pt-BR', options).format(num);
}
