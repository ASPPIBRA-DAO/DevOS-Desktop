export const allLangs = [
  { value: 'pt', label: 'Português', icon: 'flagpack:br' },
  { value: 'en', label: 'English', icon: 'flagpack:gb-nir' },
];

export function useTranslate() {
  return {
    t: (key: string) => key,
    currentLang: {
      value: 'pt',
      systemValue: undefined,
    },
  };
}
