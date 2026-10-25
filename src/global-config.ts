import { paths } from 'src/routes/paths';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  serverUrl: string;
  assetsDir: string;
  auth: {
    method: 'jwt';
    skip: boolean;
    redirectPath: string;
  };
};

export const CONFIG: ConfigValue = {
  appName: 'DevOS Desktop',
  appVersion: '2.0.0',
  serverUrl: import.meta.env.VITE_SERVER_URL ?? 'https://api.asppibra.com',
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  auth: {
    method: 'jwt',
    skip: true,
    redirectPath: paths.dashboard.root,
  },
};
