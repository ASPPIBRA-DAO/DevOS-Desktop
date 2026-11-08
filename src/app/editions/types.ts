import type React from 'react';
import type { EditionNavigationGroup } from './navigation-types';

export type { EditionNavigationItem, EditionNavigationGroup } from './navigation-types';

export interface RouteConfig {
  path: string;
  label: string;
  icon: string;
  component: React.ComponentType;
}

export interface EditionConfig {
  editionId: 'node' | 'cockpit';
  name: string;
  subtitle: string;
  bundleId: string;
  routes: RouteConfig[];
  navigation: EditionNavigationGroup[];
}
