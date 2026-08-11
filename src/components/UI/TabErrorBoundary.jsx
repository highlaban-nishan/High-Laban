import React from 'react';

/**
 * Error Boundary wrapper for Admin Dashboard tabs.
 * Catches runtime crashes inside tab components and shows a friendly error
 * instead of blinking white screen.
 */
class TabErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[TabErrorBoundary] Tab crashed:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#94a3b8',
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '12px',
                    margin: '2rem'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>
                        {this.props.tabName || 'This tab'} encountered an error
                    </h3>
                    <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        🔄 Retry
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default TabErrorBoundary;
