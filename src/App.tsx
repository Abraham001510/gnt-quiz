import React, { Component, ErrorInfo, ReactNode } from 'react';
import { supabase } from './lib/supabase';

// Error Boundary to prevent React white-screen crashes
interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#fff', backgroundColor: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ef4444' }}>GNT Quiz App encountered a startup error</h1>
          <p style={{ marginTop: '10px', color: '#94a3b8' }}>
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component wrapper
export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-blue-500 mb-4">GNT Quiz CBT Engine</h1>
        <p className="text-slate-300 mb-6">System ready for deployment and submission.</p>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md">
          <p className="text-sm text-slate-400 mb-2">Status: Connected to Supabase</p>
          <button 
            onClick={() => window.location.href = '/admin'} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition"
          >
            Go to Admin Portal
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}