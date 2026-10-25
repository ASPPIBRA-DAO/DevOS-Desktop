import type { ColorSystem } from '@mui/material/styles';
import type { SettingsState } from 'src/components/settings';
import type { ThemeOptions, ThemeColorScheme } from '../types';

import { setFont, hexToRgbChannel, createPaletteChannel } from 'minimal-shared/utils';

import { primaryColorPresets } from './color-presets';
import { createShadowColor } from '../core/custom-shadows';

// ----------------------------------------------------------------------

export function applySettingsToTheme(
  theme: ThemeOptions,
  settingsState?: SettingsState
): ThemeOptions {
  const {
    direction,
    fontFamily,
    contrast = 'default',
    primaryColor = 'default',
  } = settingsState ?? {};

  const isDefaultContrast = contrast === 'default';
  const isDefaultPrimaryColor = primaryColor === 'default';

  const lightPalette = theme.colorSchemes?.light?.palette as ColorSystem['palette'];
  const primaryColorPalette = createPaletteChannel(primaryColorPresets[primaryColor]);

  const updateColorScheme = (schemeName: ThemeColorScheme) => {
    const currentScheme = theme.colorSchemes?.[schemeName];

    if (!currentScheme) {
      return undefined;
    }

    const updatedPalette = {
      ...(currentScheme.palette || {}),
      ...(!isDefaultPrimaryColor && {
        primary: primaryColorPalette,
      }),
      ...(schemeName === 'light' && {
        background: {
          ...(lightPalette?.background || {}),
          ...(!isDefaultContrast && {
            default: lightPalette.grey[200],
            defaultChannel: hexToRgbChannel(lightPalette.grey[200]),
          }),
        },
      }),
    };

    const updatedCustomShadows = {
      ...(currentScheme.customShadows || {}),
      ...(!isDefaultPrimaryColor && {
        primary: createShadowColor(primaryColorPalette.mainChannel),
      }),
    };

    return {
      ...Object(currentScheme),
      palette: updatedPalette,
      customShadows: updatedCustomShadows,
    };
  };

  return {
    ...theme,
    direction,
    colorSchemes: {
      light: updateColorScheme('light'),
      dark: updateColorScheme('dark'),
    },
    typography: {
      ...(theme.typography || {}),
      fontFamily: setFont(fontFamily),
    },
  };
}
