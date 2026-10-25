import type { CSSObject } from '@mui/material/styles';

export function textGradient(color?: string): CSSObject {
  return {
    background: `linear-gradient(${color})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    color: 'transparent',
  };
}

export type MaxLineProps = {
  line: number;
};

export function maxLine({ line }: MaxLineProps): CSSObject {
  return {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: line,
    WebkitBoxOrient: 'vertical',
  };
}
