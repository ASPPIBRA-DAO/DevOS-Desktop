import type React from 'react';

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
}
