import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      showDetails: false
    };

    this.retryButtonRef = null;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Callback for external logging if provided
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
  } catch {
        // swallow secondary logging errors
      }
    }

    // Report error to logging service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  componentDidUpdate(prevProps, prevState) {
    // Focus the retry button when error first appears
    if (this.state.hasError && !prevState.hasError && this.retryButtonRef) {
      // Defer focus to next tick so element exists and is focusable in tests
      setTimeout(() => {
        try { this.retryButtonRef?.focus(); } catch { /* ignore */ }
      }, 0);
    }

    // If children changed after an error, reset error state automatically
    if (
      prevState.hasError && this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      // Reset error state to try rendering new children
      // Avoid infinite loops by only resetting when children changed
      // and we are still in error state
      this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    }
  }

  render() {
    if (this.state.hasError) {
  const { fallback: FallbackComponent } = this.props; // children not needed in fallback branch
      
      // Custom fallback component
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            retry={this.handleRetry}
            retryCount={this.state.retryCount}
          />
        );
      }

      // Default fallback UI
      return (
        <div className={styles.errorBoundary} role="alert" aria-live="assertive">
          <div className={styles.errorContent}>
            <AlertTriangle 
              className={styles.errorIcon} 
              size={48} 
              aria-hidden="true"
            />
            <h2 className={styles.errorTitle}>
              Bir şeyler ters gitti
            </h2>
            <p className={styles.errorMessage}>
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
            </p>
            
            <div className={styles.errorActions}>
              <button 
                className={styles.retryButton}
                onClick={this.handleRetry}
                aria-label="Tekrar dene"
                tabIndex={0}
                autoFocus
                ref={(el) => { this.retryButtonRef = el; }}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Tekrar Dene
              </button>
              <button 
                className={styles.reloadButton}
                onClick={() => (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function' ? window.location.reload() : undefined)}
                aria-label="Sayfayı yenile"
              >
                Sayfayı Yenile
              </button>
              {this.state.error && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                >
                  {this.state.showDetails ? 'Hata detaylarını gizle' : 'Hata detaylarını göster'}
                </button>
              )}
            </div>

            {this.state.error && this.state.showDetails && (
              <div className={styles.errorDetails}>
                <div><strong>Hata mesajı:</strong> {this.state.error.message}</div>
                {this.state.errorInfo?.componentStack && (
                  <pre className={styles.errorStack}>{this.state.errorInfo.componentStack}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
