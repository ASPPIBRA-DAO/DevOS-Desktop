import type { Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function dashboardLayoutVars(theme: Theme) {
  return {
    '--layout-nav-zIndex': theme.zIndex.drawer + 1,
    '--layout-header-zIndex': theme.zIndex.appBar + 1,
    '--layout-nav-mini-width': '88px',
    '--layout-nav-vertical-width': '280px',
    '--layout-nav-horizontal-height': '64px',
  };
}

export function dashboardNavColorVars(
  theme: Theme,
  navColor?: string,
  navLayout?: string
) {
  return {
    layout: {},
    section: {},
  };
}
