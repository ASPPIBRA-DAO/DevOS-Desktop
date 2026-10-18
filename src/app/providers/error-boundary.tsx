import React, { Component, type ReactNode } from 'react';

import { ErrorView } from '../pages/error-view';

// ----------------------------------------------------------------------

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DevOS Desktop — Uncaught render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorView error={this.state.error} resetErrorBoundary={this.handleReset} />;
    }

    return this.props.children;
  }
}
