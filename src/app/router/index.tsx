import React from 'react';
import currentEdition from '@edition';
import { Route, Routes } from 'react-router';

import { DevOSLayout } from '../layouts/devos/layout';
import { NotFoundView } from '../pages/not-found-view';
import { AuthCenteredLayout } from '../../layouts/auth-centered';
import { useBootstrap } from '../providers/app-bootstrap-provider';
import {
  JwtSignInView,
  JwtSignUpView,
  JwtVerifyView,
  JwtResetPasswordView,
  JwtUpdatePasswordView,
} from '../../auth/view/jwt';

export function AppRouter() {
  const { state } = useBootstrap();

  // 1. Primeiro acesso ao hardware: cofre não inicializado -> Tela de Setup de Senha Mestre
  if (state === 'UNINITIALIZED') {
    return (
      <AuthCenteredLayout>
        <JwtSignUpView isInitVault />
      </AuthCenteredLayout>
    );
  }

  // 2. Uso diário: cofre inicializado mas trancado -> Tela de Login / Desbloqueio
  if (state === 'READY_LOCKED') {
    return (
      <AuthCenteredLayout>
        <JwtSignInView />
      </AuthCenteredLayout>
    );
  }

  // 3. Sessão liberada (READY_UNLOCKED / WEB_PREVIEW): rotas completas do sistema
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthCenteredLayout>
            <JwtSignInView />
          </AuthCenteredLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AuthCenteredLayout>
            <JwtSignUpView />
          </AuthCenteredLayout>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthCenteredLayout>
            <JwtResetPasswordView />
          </AuthCenteredLayout>
        }
      />
      <Route
        path="/reset-password"
        element={
          <AuthCenteredLayout>
            <JwtUpdatePasswordView />
          </AuthCenteredLayout>
        }
      />
      <Route
        path="/verify"
        element={
          <AuthCenteredLayout>
            <JwtVerifyView />
          </AuthCenteredLayout>
        }
      />

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
