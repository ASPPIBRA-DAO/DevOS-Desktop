import type { CSSObject } from '@mui/material/styles';
import type { NavItemProps } from '../types';

import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from '../../iconify';
import { createNavItem } from '../utils';
import { navItemStyles, navSectionClasses } from '../styles';

// ----------------------------------------------------------------------

export function NavItem({
  path,
  icon,
  info,
  title,
  caption,
  /********/
  open,
  active,
  disabled,
  /********/
  depth,
  render,
  hasChild,
  slotProps,
  className,
  externalLink,
  enabledRootRedirect,
  ...other
}: NavItemProps) {
  const navItem = createNavItem({
    path,
    icon,
    info,
    depth,
    render,
    hasChild,
    externalLink,
    enabledRootRedirect,
  });

  const ownerState: StyledState = {
    open,
    active,
    disabled,
    variant: navItem.rootItem ? 'rootItem' : 'subItem',
  };

  return (
    <ItemRoot
      aria-label={title}
      {...ownerState}
      {...navItem.baseProps}
      className={mergeClasses([navSectionClasses.item.root, className], {
        [navSectionClasses.state.open]: open,
        [navSectionClasses.state.active]: active,
        [navSectionClasses.state.disabled]: disabled,
      })}
      sx={slotProps?.sx}
      {...other}
    >
      {icon && (
        <ItemIcon {...ownerState} className={navSectionClasses.item.icon} sx={slotProps?.icon}>
          {navItem.renderIcon}
        </ItemIcon>
      )}

      {title && (
        <ItemTexts {...ownerState} className={navSectionClasses.item.texts} sx={slotProps?.texts}>
          <ItemTitle {...ownerState} className={navSectionClasses.item.title} sx={slotProps?.title}>
            {title}
          </ItemTitle>

          {caption && (
            <Tooltip title={caption} placement="top-start">
              <ItemCaptionText
                {...ownerState}
                className={navSectionClasses.item.caption}
                sx={slotProps?.caption}
              >
                {caption}
              </ItemCaptionText>
            </Tooltip>
          )}
        </ItemTexts>
      )}

      {info && (
        <ItemInfo {...ownerState} className={navSectionClasses.item.info} sx={slotProps?.info}>
          {navItem.renderInfo}
        </ItemInfo>
      )}

      {hasChild && (
        <ItemArrow
          {...ownerState}
          icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
          className={navSectionClasses.item.arrow}
          sx={slotProps?.arrow}
        />
      )}
    </ItemRoot>
  );
}

// ----------------------------------------------------------------------

type StyledState = Pick<NavItemProps, 'open' | 'active' | 'disabled'> & {
  variant: 'rootItem' | 'subItem';
};

const shouldForwardProp = (prop: string) =>
  !['open', 'active', 'disabled', 'variant', 'sx'].includes(prop);

/**
 * @slot root
 */
const ItemRoot = styled(ButtonBase, { shouldForwardProp })<StyledState>(({
  active,
  open,
  theme,
}) => {
  const bulletSvg = `"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 14 14'%3E%3Cpath d='M1 1v4a8 8 0 0 0 8 8h4' stroke='%23efefef' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"`;

  const bulletStyles: CSSObject = {
    left: 0,
    content: '""',
    position: 'absolute',
    width: 'var(--nav-bullet-size)',
    height: 'var(--nav-bullet-size)',
    backgroundColor: 'var(--nav-bullet-light-color)',
    mask: `url(${bulletSvg}) no-repeat 50% 50%/100% auto`,
    WebkitMask: `url(${bulletSvg}) no-repeat 50% 50%/100% auto`,
    transform:
      theme.direction === 'rtl'
        ? 'translate(calc(var(--nav-bullet-size) * 1), calc(var(--nav-bullet-size) * -0.4)) scaleX(-1)'
        : 'translate(calc(var(--nav-bullet-size) * -1), calc(var(--nav-bullet-size) * -0.4))',
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--nav-bullet-dark-color)',
    }),
  };

  const rootItemStyles: CSSObject = {
    minHeight: 'var(--nav-item-root-height)',
    border: '1px solid transparent',
    transition: theme.transitions.create(
      ['background-color', 'box-shadow', 'transform', 'border-color', 'background'],
      { duration: theme.transitions.duration.shorter }
    ),
    '&:hover': {
      transform: 'translateY(-1px) translateX(2px)',
      background:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.85) 100%)',
      borderColor: 'rgba(145, 158, 171, 0.22)',
      boxShadow:
        '0 4px 14px -2px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
      ...theme.applyStyles('dark', {
        background:
          'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        boxShadow:
          '0 4px 16px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }),
    },
    ...(open && {
      color: 'var(--nav-item-root-open-color)',
      backgroundColor: 'var(--nav-item-root-open-bg)',
    }),
    ...(active && {
      color: 'var(--nav-item-root-active-color)',
      background:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.95) 100%)',
      borderColor: varAlpha(theme.palette.primary.main, 0.35),
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      boxShadow: [
        `0 8px 24px -4px ${varAlpha(theme.palette.primary.main, 0.28)}`,
        '0 2px 6px -1px rgba(15, 23, 42, 0.08)',
        'inset 0 1.5px 0 #ffffff',
        `inset 0 -1.5px 0 ${varAlpha(theme.palette.primary.main, 0.15)}`,
      ].join(', '),
      '&:hover': {
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(235, 252, 241, 0.98) 100%)',
        transform: 'none',
      },
      ...theme.applyStyles('dark', {
        color: 'var(--nav-item-root-active-color-on-dark)',
        background:
          'linear-gradient(180deg, rgba(6, 78, 59, 0.35) 0%, rgba(2, 44, 34, 0.45) 100%)',
        borderColor: 'rgba(0, 255, 127, 0.35)',
        borderLeft: '4px solid #00ff7f',
        boxShadow:
          '0 0 24px -2px rgba(0, 255, 127, 0.32), inset 0 1.5px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 255, 127, 0.2)',
      }),
    }),
  };

  const subItemStyles: CSSObject = {
    minHeight: 'var(--nav-item-sub-height)',
    '&::before': bulletStyles,
    ...(open && {
      color: 'var(--nav-item-sub-open-color)',
      backgroundColor: 'var(--nav-item-sub-open-bg)',
    }),
    ...(active && {
      color: 'var(--nav-item-sub-active-color)',
      backgroundColor: 'var(--nav-item-sub-active-bg)',
    }),
  };

  return {
    width: '100%',
    paddingTop: 'var(--nav-item-pt)',
    paddingLeft: 'var(--nav-item-pl)',
    paddingRight: 'var(--nav-item-pr)',
    paddingBottom: 'var(--nav-item-pb)',
    borderRadius: 'var(--nav-item-radius)',
    color: 'var(--nav-item-color)',
    variants: [
      { props: { variant: 'rootItem' }, style: rootItemStyles },
      { props: { variant: 'subItem' }, style: subItemStyles },
      { props: { disabled: true }, style: navItemStyles.disabled },
    ],
  };
});

/**
 * @slot icon
 */
const ItemIcon = styled('span', { shouldForwardProp })<StyledState>(({ theme, active }) => ({
  ...navItemStyles.icon,
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  flexShrink: 0,
  marginRight: 10,
  transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow', 'color', 'transform']),
  background: active
    ? 'linear-gradient(135deg, rgba(0, 167, 111, 0.2) 0%, rgba(0, 210, 255, 0.14) 100%)'
    : 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
  border: active
    ? `1px solid ${varAlpha(theme.palette.primary.main, 0.45)}`
    : '1px solid rgba(145, 158, 171, 0.22)',
  boxShadow: active
    ? `0 0 14px 0 ${varAlpha(theme.palette.primary.main, 0.35)}, inset 0 1px 0 #ffffff`
    : '0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 #ffffff',
  color: active ? theme.palette.primary.main : 'inherit',
  ...theme.applyStyles('dark', {
    background: active
      ? 'linear-gradient(135deg, rgba(0, 255, 127, 0.25) 0%, rgba(0, 210, 255, 0.15) 100%)'
      : 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: active
      ? '1px solid rgba(0, 255, 127, 0.5)'
      : '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: active
      ? '0 0 16px 0 rgba(0, 255, 127, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      : '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    color: active ? '#00ff7f' : 'inherit',
  }),
  '& > svg, & > span': {
    width: 20,
    height: 20,
  },
}));

/**
 * @slot texts
 */
const ItemTexts = styled('span', { shouldForwardProp })<StyledState>(() => ({
  ...navItemStyles.texts,
}));

/**
 * @slot title
 */
const ItemTitle = styled('span', { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.title(theme),
  ...theme.typography.body2,
  fontWeight: theme.typography.fontWeightMedium,
  variants: [
    { props: { active: true }, style: { fontWeight: 600 } },
  ],
}));

/**
 * @slot caption text
 */
const ItemCaptionText = styled('span', { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.captionText(theme),
  color: 'var(--nav-item-caption-color)',
}));

/**
 * @slot info
 */
const ItemInfo = styled('span', { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.info,
}));

/**
 * @slot arrow
 */
const ItemArrow = styled(Iconify, { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.arrow(theme),
}));
