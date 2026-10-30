import type { TypographyProps } from '@mui/material/Typography';

import Typography from '@mui/material/Typography';

export function Clause({
  text,
  children,
  sx,
}: {
  text?: React.ReactNode;
  children?: React.ReactNode;
  sx?: TypographyProps['sx'];
}) {
  return (
    <Typography
      variant="body1"
      sx={{
        color: '#000000',
        mb: 1.5,
        lineHeight: 1.5,
        textAlign: 'justify',
        fontSize: '12pt',
        hyphens: 'auto',
        wordBreak: 'break-word',
        ...sx,
      }}
    >
      {children || text}
    </Typography>
  );
}

type ABNTTextProps = {
  children: React.ReactNode;
  indent?: boolean;
  sx?: TypographyProps['sx'];
};

export function ABNTText({ children, indent = true, sx }: ABNTTextProps) {
  return (
    <Typography
      variant="body1"
      sx={{
        color: '#000000',
        mb: 1.5,
        textAlign: 'justify',
        lineHeight: 1.5,
        fontSize: '12pt',
        textIndent: indent ? '1.25cm' : '0cm',
        hyphens: 'auto',
        wordBreak: 'break-word',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}
