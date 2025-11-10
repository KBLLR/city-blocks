import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  fallback?: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;
    if (error) {
      if (fallback) return fallback(error, this.reset);
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow">
          <p className="font-semibold">Something went wrong.</p>
          <p className="text-xs opacity-75">{error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      );
    }
    return children;
  }
}
