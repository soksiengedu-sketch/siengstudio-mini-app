import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0c13] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-bold">មានបញ្ហាបច្ចេកទេសបន្តិចបន្តួច</h2>
          <p className="text-xs text-gray-400 mt-2 max-w-xs">
            {this.state.error?.message || 'សូមព្យាយាម Refresh ឬចូលកម្មវិធីឡើងវិញ'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs shadow-lg active:scale-95 transition-transform"
          >
            Refresh កម្មវិធីឡើងវិញ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
