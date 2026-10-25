import type { Theme, CSSObject } from '@mui/material/styles';

export type SoftStylesProps = {
  color?: string;
};

export function softStyles(props?: SoftStylesProps): CSSObject {
  return {};
}

export function paperStyles(theme: Theme): CSSObject {
  return {};
}

export function filledStyles(): CSSObject {
  return {};
}

export function menuItemStyles(): CSSObject {
  return {};
}
