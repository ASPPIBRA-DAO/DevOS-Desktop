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

  const itemElement = (
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

      {title && !navItem.rootItem && (
        <ItemTitle {...ownerState} className={navSectionClasses.item.title} sx={slotProps?.title}>
          {title}
        </ItemTitle>
      )}

      {caption && (
        <Tooltip title={caption} arrow placement="right">
          <ItemCaptionIcon
            {...ownerState}
            icon="eva:info-outline"
            className={navSectionClasses.item.caption}
            sx={slotProps?.caption}
          />
        </Tooltip>
      )}

      {info && navItem.subItem && (
        <ItemInfo {...ownerState} className={navSectionClasses.item.info} sx={slotProps?.info}>
          {navItem.renderInfo}
        </ItemInfo>
      )}

      {hasChild && (
        <ItemArrow
          {...ownerState}
          icon="eva:arrow-ios-forward-fill"
          className={navSectionClasses.item.arrow}
          sx={slotProps?.arrow}
        />
      )}
    </ItemRoot>
  );

  if (navItem.rootItem && title && !hasChild) {
    return (
      <Tooltip title={title} arrow placement="right" enterDelay={100}>
        {itemElement}
      </Tooltip>
    );
  }

  return itemElement;
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
  const rootItemStyles: CSSObject = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '46px',
    height: '46px',
    minHeight: '46px',
    margin: '0 auto',
    borderRadius: '12px',
    padding: 0,
    transition: theme.transitions.create(['background-color', 'color', 'transform', 'box-shadow'], {
      duration: theme.transitions.duration.shorter,
    }),
    '&:hover': {
      backgroundColor: 'var(--nav-item-hover-bg)',
      transform: 'scale(1.08)',
    },
    ...(open && {
      color: 'var(--nav-item-root-open-color)',
      backgroundColor: 'var(--nav-item-root-open-bg)',
    }),
    ...(active && {
      color: 'var(--nav-item-root-active-color)',
      backgroundColor: 'var(--nav-item-root-active-bg)',
      boxShadow: `0 0 16px ${varAlpha(theme.palette.primary.main, 0.2)}`,
      '&:hover': {
        backgroundColor: 'var(--nav-item-root-active-hover-bg)',
        transform: 'scale(1.08)',
      },
      ...theme.applyStyles('dark', {
        color: 'var(--nav-item-root-active-color-on-dark)',
        boxShadow: '0 0 16px rgba(0, 255, 127, 0.22)',
      }),
    }),
  };

  const subItemStyles: CSSObject = {
    minHeight: 'var(--nav-item-sub-height)',
    padding: 'var(--nav-item-sub-padding)',
    color: theme.palette.text.secondary,
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
    color: 'var(--nav-item-color)',
    borderRadius: 'var(--nav-item-radius)',
    '&:hover': { backgroundColor: 'var(--nav-item-hover-bg)' },
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
const ItemIcon = styled('span', { shouldForwardProp })<StyledState>(() => ({
  ...navItemStyles.icon,
  width: 'var(--nav-icon-size)',
  height: 'var(--nav-icon-size)',
  margin: 'var(--nav-icon-root-margin)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    width: '100%',
    height: '100%',
  },
  variants: [{ props: { variant: 'subItem' }, style: { margin: 'var(--nav-icon-sub-margin)' } }],
}));

/**
 * @slot title
 */
const ItemTitle = styled('span', { shouldForwardProp })<StyledState>(({ active, theme }) => ({
  ...navItemStyles.title(theme),
  lineHeight: '16px',
  fontSize: theme.typography.pxToRem(10),
  fontWeight: 600,
  variants: [
    {
      props: { variant: 'rootItem' },
      style: { ...(active && { fontWeight: theme.typography.fontWeightBold }) },
    },
    {
      props: { variant: 'subItem' },
      style: {
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeightMedium,
        ...(active && { fontWeight: 600 }),
      },
    },
  ],
}));

/**
 * @slot caption icon
 */
const ItemCaptionIcon = styled(Iconify, { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.captionIcon,
  color: 'var(--nav-item-caption-color)',
  variants: [{ props: { variant: 'rootItem' }, style: { top: 11, left: 6, position: 'absolute' } }],
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
  variants: [
    {
      props: { variant: 'rootItem' },
      style: {
        margin: 0,
        top: 11,
        right: 6,
        position: 'absolute',
      },
    },
    { props: { variant: 'subItem' }, style: { marginRight: theme.spacing(-0.5) } },
  ],
}));
