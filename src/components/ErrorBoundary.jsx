import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/** Last-resort guard so one bad record can't blank the whole dashboard. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Content Studio crashed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 p-6 text-slate-800">
        <div className="card max-w-md p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 text-amber-500" size={28} />
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your saved posts are still in this browser. Reload to try again — if the problem repeats, export
            the data from a previous backup.
          </p>
          <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-slate-500/10 p-2 text-left text-xs">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button className="btn-primary mt-4" onClick={() => window.location.reload()}>
            <RotateCcw size={15} />
            Reload dashboard
          </button>
        </div>
      </div>
    );
  }
}
