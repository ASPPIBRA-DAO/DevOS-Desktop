import React from 'react';
import currentEdition from '@edition';
import { Route, Routes, Navigate, HashRouter } from 'react-router';

import { DashboardLayout } from '../layouts/dashboard-layout';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          {currentEdition.routes.map((r) => {
            const Component = r.component;
            return <Route key={r.path} path={r.path} element={<Component />} />;
          })}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
