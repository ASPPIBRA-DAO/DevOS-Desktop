import type { NavGroupProps, NavSectionProps, NavItemDataProps } from '../types';

import { useLocation } from 'react-router';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { isActiveLink, mergeClasses } from 'minimal-shared/utils';

import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';

import { NavList } from './nav-list';
import { Nav, NavUl, NavLi, NavSubheader } from '../components';
import { navSectionClasses, navSectionCssVars } from '../styles';

// ----------------------------------------------------------------------

function checkItemMatch(item: NavItemDataProps, pathname: string): boolean {
  if (isActiveLink(pathname, item.path, item.deepMatch ?? !!item.children)) {
    return true;
  }
  if (item.children) {
    return item.children.some((child) => checkItemMatch(child, pathname));
  }
  return false;
}

function getActiveGroupKey(
  data: NavSectionProps['data'],
  pathname: string,
  checkPermissions?: (allowedRoles?: string | string[]) => boolean
): string {
  // 1. Procura se algum grupo contém a rota ativa atual
  for (let i = 0; i < data.length; i += 1) {
    const group = data[i];
    const groupKey = group.subheader ?? group.items[0]?.title ?? String(i);

    const hasActiveItem = group.items.some((item) => {
      if (item.allowedRoles && checkPermissions && checkPermissions(item.allowedRoles)) {
        return false;
      }
      return checkItemMatch(item, pathname);
    });

    if (hasActiveItem) {
      return groupKey;
    }
  }

  // 2. Se nenhuma rota coincidir (ex: inicialização no root '/'), abre apenas o primeiro grupo com itens
  const firstAvailableGroup = data.find((group) => {
    if (!checkPermissions) return group.items.length > 0;
    return group.items.some((item) => !item.allowedRoles || !checkPermissions(item.allowedRoles));
  });

  return (
    firstAvailableGroup?.subheader ??
    firstAvailableGroup?.items[0]?.title ??
    (data[0]?.subheader ?? data[0]?.items[0]?.title ?? '0')
  );
}

// ----------------------------------------------------------------------

export function NavSectionVertical({
  sx,
  data,
  render,
  className,
  slotProps,
  checkPermissions,
  enabledRootRedirect,
  cssVars: overridesVars,
  accordion = true,
  ...other
}: NavSectionProps) {
  const theme = useTheme();
  const { pathname } = useLocation();

  // Inicialização: somente 1 grupo ativado (aquele da rota ativa ou o primeiro do menu)
  const initialKey = useMemo(
    () => getActiveGroupKey(data, pathname, checkPermissions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [openGroupKey, setOpenGroupKey] = useState<string>(initialKey);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    [initialKey]: true,
  }));

  // Sincroniza automaticamente quando o usuário navega para uma rota de outro grupo
  useEffect(() => {
    for (let i = 0; i < data.length; i += 1) {
      const group = data[i];
      const groupKey = group.subheader ?? group.items[0]?.title ?? String(i);

      const hasActiveItem = group.items.some((item) => {
        if (item.allowedRoles && checkPermissions && checkPermissions(item.allowedRoles)) {
          return false;
        }
        return checkItemMatch(item, pathname);
      });

      if (hasActiveItem) {
        if (accordion) {
          setOpenGroupKey(groupKey);
        } else {
          setOpenGroups((prev) => ({ ...prev, [groupKey]: true }));
        }
        break;
      }
    }
  }, [pathname, accordion, checkPermissions, data]);

  const handleToggleGroup = useCallback(
    (key: string) => {
      if (accordion) {
        setOpenGroupKey((prev) => (prev === key ? '' : key));
      } else {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
      }
    },
    [accordion]
  );

  const cssVars = { ...navSectionCssVars.vertical(theme), ...overridesVars };

  return (
    <Nav
      className={mergeClasses([navSectionClasses.vertical, className])}
      sx={[{ ...cssVars }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <NavUl sx={{ flex: '1 1 auto', gap: 'var(--nav-item-gap)' }}>
        {data.map((group, index) => {
          const groupKey = group.subheader ?? group.items[0]?.title ?? String(index);
          const isGroupOpen = accordion ? openGroupKey === groupKey : !!openGroups[groupKey];

          return (
            <Group
              key={groupKey}
              subheader={group.subheader}
              items={group.items}
              render={render}
              slotProps={slotProps}
              checkPermissions={checkPermissions}
              enabledRootRedirect={enabledRootRedirect}
              open={isGroupOpen}
              onToggle={() => handleToggleGroup(groupKey)}
            />
          );
        })}
      </NavUl>
    </Nav>
  );
}

// ----------------------------------------------------------------------

function Group({
  items,
  render,
  subheader,
  slotProps,
  checkPermissions,
  enabledRootRedirect,
  open: controlledOpen,
  onToggle: controlledOnToggle,
}: NavGroupProps) {
  const uncontrolledOpen = useBoolean(true);

  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen.value;
  const handleToggle = controlledOnToggle ?? uncontrolledOpen.onToggle;

  // Pre-filter items to see if this group has any visible items
  const allowedItems = items.filter((item) => {
    if (item.allowedRoles && checkPermissions && checkPermissions(item.allowedRoles)) {
      return false; // Hidden by role
    }
    return true; // Allowed
  });

  // If all items are hidden, hide the entire group (including subheader)
  if (allowedItems.length === 0) {
    return null;
  }

  const renderContent = () => (
    <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
      {allowedItems.map((list) => (
        <NavList
          key={list.title}
          data={list}
          render={render}
          depth={1}
          slotProps={slotProps}
          checkPermissions={checkPermissions}
          enabledRootRedirect={enabledRootRedirect}
        />
      ))}
    </NavUl>
  );

  return (
    <NavLi>
      {subheader ? (
        <>
          <NavSubheader
            data-title={subheader}
            open={isOpen}
            onClick={handleToggle}
            sx={slotProps?.subheader}
          >
            {subheader}
          </NavSubheader>

          <Collapse in={isOpen}>{renderContent()}</Collapse>
        </>
      ) : (
        renderContent()
      )}
    </NavLi>
  );
}
