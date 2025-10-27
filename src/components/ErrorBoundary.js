import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          backgroundColor: '#ff6b6b',
          color: 'white',
          borderRadius: '8px',
          margin: '20px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h2>🚨 Something went wrong</h2>
          <p>The application encountered an unexpected error.</p>
          <details style={{ 
            marginTop: '10px', 
            textAlign: 'left',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '0.9em'
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
              Error Details
            </summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
          <div style={{ marginTop: '15px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#ff6b6b',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
                fontWeight: 'bold'
              }}
            >
              🔄 Refresh Page
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏠 Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;