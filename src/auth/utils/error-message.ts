export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
