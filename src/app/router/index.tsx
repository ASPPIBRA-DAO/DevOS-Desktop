import React from 'react';
import currentEdition from '@edition';
import { Route, Routes } from 'react-router';

import { DevOSLayout } from '../layouts/devos/layout';
import { NotFoundView } from '../pages/not-found-view';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<DevOSLayout />}>
        {currentEdition.routes.map((r) => {
          const Component = r.component;
          return <Route key={r.path} path={r.path} element={<Component />} />;
        })}
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  );
}
