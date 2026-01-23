import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
          <div className="max-h-[80vh] w-[80vw] bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 px- text-center flex flex-col gap-2">
            <div>
              <span className="material-symbols-outlined text-[70px] text-red-700">warning</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400 text-[14px]">We're sorry, but something unexpected happened. Please try refreshing the page.</p>
            
            {
                process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-12 text-left">
                      <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">Error Details (Development Only)</summary>
                      <pre className="text-xs bg-gray-100 dark:bg-zinc-900 p-3 rounded overflow-auto max-h-40">
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                )
            }
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
