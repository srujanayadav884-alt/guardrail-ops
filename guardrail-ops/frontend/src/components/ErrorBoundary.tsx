import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real deployment this would also report to a monitoring service
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm uppercase tracking-widest text-guard-blue">GuardRail-Ops</p>
            <h1 className="mt-2 text-xl font-bold text-guard-navy">Something went wrong</h1>
            <p className="mt-2 text-sm text-guard-slate">
              An unexpected error occurred while rendering this page. You can try returning to the
              home screen.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 rounded-md bg-guard-blue px-5 py-2 text-sm font-medium text-white hover:bg-guard-navy"
            >
              Back to safety
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
