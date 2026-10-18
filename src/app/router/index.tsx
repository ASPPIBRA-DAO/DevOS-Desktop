import React from 'react';
import currentEdition from '@edition';
import { Route, Routes } from 'react-router';

import { NotFoundView } from '../pages/not-found-view';
import { DashboardLayout } from '../layouts/dashboard-layout';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        {currentEdition.routes.map((r) => {
          const Component = r.component;
          return <Route key={r.path} path={r.path} element={<Component />} />;
        })}
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  );
}
