import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { createErrorContext, logError } from '../utils/errorHandler';

/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 * Prevents white screen of death and provides recovery options
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorContext: null,
      showDetails: import.meta.env.DEV,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const context = createErrorContext(error, errorInfo);

    // Log the error with full context
    logError(error, {
      type: 'ErrorBoundary',
      path: window.location.pathname,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorContext: context,
    });

    // Call optional error handler prop
    this.props.onError?.(error, context);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorContext: null,
    });

    // Call optional reset handler
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleNavigateHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    const { hasError, error, errorContext, showDetails } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    const isProduction = import.meta.env.PROD;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-status-critical/15 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-status-critical" />
            </div>
          </div>

          {/* Error Message */}
          <div className="bg-surface border border-border rounded-lg p-6 text-center space-y-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text-primary mb-1">
                Algo deu errado
              </h1>
              <p className="text-sm text-text-secondary">
                Desculpe, ocorreu um erro inesperado na aplicação.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {!isProduction && showDetails && errorContext && (
              <div className="bg-surface-elevated border border-border/50 rounded-md p-3 text-left space-y-2">
                <div className="text-xs font-mono text-text-muted">
                  <p className="font-semibold text-text-primary mb-1">Error Type:</p>
                  <p className="text-accent">{errorContext.type}</p>
                </div>

                {errorContext.message && (
                  <div className="text-xs font-mono text-text-muted">
                    <p className="font-semibold text-text-primary mb-1">Message:</p>
                    <p className="text-status-critical break-words">{errorContext.message}</p>
                  </div>
                )}

                {errorContext.componentStack && (
                  <details className="text-xs cursor-pointer">
                    <summary className="font-semibold text-text-primary hover:text-accent transition-colors">
                      Component Stack
                    </summary>
                    <pre className="mt-2 p-2 bg-background rounded border border-border/30 overflow-x-auto text-[10px] text-text-muted">
                      {errorContext.componentStack}
                    </pre>
                  </details>
                )}

                <details className="text-xs cursor-pointer">
                  <summary className="font-semibold text-text-primary hover:text-accent transition-colors">
                    Full Error Object
                  </summary>
                  <pre className="mt-2 p-2 bg-background rounded border border-border/30 overflow-x-auto text-[10px] text-text-muted">
                    {JSON.stringify(error, null, 2).slice(0, 500)}
                  </pre>
                </details>
              </div>
            )}

            {/* Error Message (Production) */}
            {isProduction && errorContext?.message && (
              <p className="text-sm text-text-secondary bg-surface-elevated border border-border/50 rounded-md p-3">
                {errorContext.message}
              </p>
            )}
          </div>

          {/* Recovery Actions */}
          <div className="space-y-2">
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-lg bg-accent text-background font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>

            {this.props.showReloadButton !== false && (
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                Recarregar Página
              </button>
            )}

            <button
              onClick={this.handleNavigateHome}
              className="w-full py-2.5 px-4 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir para Dashboard
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-text-muted text-center mt-6">
            Se o problema persistir, contate o suporte técnico.
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
