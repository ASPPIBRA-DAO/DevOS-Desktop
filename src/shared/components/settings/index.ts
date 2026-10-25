import type { Direction } from '@mui/material/styles';

export type SettingsState = {
  direction?: Direction;
  fontFamily?: string;
  contrast?: 'default' | 'high';
  primaryColor?: 'default' | 'preset1' | 'preset2' | 'preset3' | 'preset4' | 'preset5';
  fontSize?: number;
  navColor?: 'integrate' | 'apparent';
  navLayout?: 'vertical' | 'horizontal' | 'mini';
};

export function useSettingsContext() {
  return {
    state: {
      direction: 'ltr' as Direction,
      contrast: 'default',
      primaryColor: 'default',
      navColor: 'integrate',
      navLayout: 'vertical',
    } as SettingsState,
    setField: (name: string, value: any) => {},
  };
}
