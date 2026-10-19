import type { BoxProps } from '@mui/material/Box';
import type { Theme, SxProps } from '@mui/material/styles';
import type { TypographyProps } from '@mui/material/Typography';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, styled } from '@mui/material/styles';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

export type EmptyContentProps = React.ComponentProps<'div'> & {
  title?: string;
  imgUrl?: string;
  filled?: boolean;
  sx?: SxProps<Theme>;
  description?: string;
  action?: React.ReactNode;
  slotProps?: {
    img?: BoxProps<'img'>;
    title?: TypographyProps;
    description?: TypographyProps;
  };
};

export function EmptyContent({
  sx,
  imgUrl,
  action,
  filled,
  slotProps,
  description,
  title = 'Nenhum dado encontrado',
  ...other
}: EmptyContentProps) {
  return (
    <ContentRoot filled={filled} sx={sx} {...other}>
      {imgUrl ? (
        <Box
          component="img"
          alt="Empty content"
          src={imgUrl}
          {...slotProps?.img}
          sx={[
            {
              width: 1,
              maxWidth: 160,
            },
            ...(Array.isArray(slotProps?.img?.sx) ? slotProps.img.sx : [slotProps?.img?.sx]),
          ]}
        />
      ) : (
        <Iconify
          icon="solar:inbox-in-bold-duotone"
          width={64}
          sx={{ color: 'text.disabled', mb: 1 }}
        />
      )}

      {title && (
        <Typography
          variant="h6"
          {...slotProps?.title}
          sx={[
            {
              mt: 1,
              textAlign: 'center',
              color: 'text.disabled',
            },
            ...(Array.isArray(slotProps?.title?.sx) ? slotProps.title.sx : [slotProps?.title?.sx]),
          ]}
        >
          {title}
        </Typography>
      )}

      {description && (
        <Typography
          variant="body2"
          {...slotProps?.description}
          sx={[
            {
              mt: 1,
              textAlign: 'center',
              color: 'text.disabled',
            },
            ...(Array.isArray(slotProps?.description?.sx)
              ? slotProps.description.sx
              : [slotProps?.description?.sx]),
          ]}
        >
          {description}
        </Typography>
      )}

      {action && action}
    </ContentRoot>
  );
}

// ----------------------------------------------------------------------

const ContentRoot = styled('div', {
  shouldForwardProp: (prop: string) => !['filled', 'sx'].includes(prop),
})<Pick<EmptyContentProps, 'filled'>>(({ filled, theme }) => {
  const greyColor = (theme.vars?.palette ?? theme.palette).grey[500];
  return {
    flexGrow: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: theme.spacing(0, 3),
    ...(filled && {
      borderRadius: Number(theme.shape.borderRadius) * 2,
      backgroundColor: alpha(greyColor, 0.04),
      border: 'dashed 1px ' + alpha(greyColor, 0.08),
    }),
  };
});
