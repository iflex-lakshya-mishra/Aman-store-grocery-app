import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white px-6 py-16 dark:bg-slate-950">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Something went wrong</p>
          <p className="mt-2 max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
            Please refresh the page. If the problem continues, try clearing site data once and sign in again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
