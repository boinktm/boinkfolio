import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#ef4444', fontFamily: 'monospace', background: '#0a0a0a', minHeight: '100vh' }}>
          <h1 style={{ color: '#e60012', marginBottom: 16 }}>App Crash</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#f0f0f0' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: 12, marginTop: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
