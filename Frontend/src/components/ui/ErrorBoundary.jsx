import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Sahayata UI caught runtime error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px 24px',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #FEE2E2',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
            textAlign: 'center',
            maxWidth: '560px',
            margin: '40px auto'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
            {this.props.fallbackTitle || 'Unable to Load View'}
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            {this.props.fallbackMessage || 'A temporary interface issue occurred. You can safely return to the dashboard or try again.'}
          </p>
          {this.state.error && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.78rem',
                color: '#475569',
                fontFamily: 'monospace',
                marginBottom: '20px',
                textAlign: 'left',
                overflowX: 'auto'
              }}
            >
              {this.state.error.toString()}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={15} /> Try Again
            </button>
            {this.props.onBack && (
              <button
                onClick={this.props.onBack}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={15} /> Back to Radar Map
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
