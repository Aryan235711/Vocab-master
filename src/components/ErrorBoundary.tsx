import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-8 bg-[#F8FAFC] text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600 text-3xl">
            !
          </div>
          <h1 className="text-2xl font-black mb-2 text-slate-900">Something went wrong</h1>
          <p className="text-slate-500 mb-6 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-[#4F46E5] text-white px-6 py-3 rounded-2xl font-bold shadow-lg"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
